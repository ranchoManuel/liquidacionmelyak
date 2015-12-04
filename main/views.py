#TODO: importante, se consume este servicio: http://fixer.io/ para pasar de EUR a USD

from django.shortcuts import render
from django.http import HttpResponse
from django.core.mail import send_mail

from .models import *

import json
import requests

from django.forms.models import model_to_dict
# Create your views here.
def index(request):
    return render(request, 'index.html')

def getPaisesJSON(request):
    response_data = {}
    todos_pais = [model_to_dict(item) for item in Pais.objects.all().order_by('nombre_pais')]
    response_data['todos_pais'] = todos_pais
    return HttpResponse(json.dumps(response_data), content_type="application/json")

def getParejasPuertosJSON_FCL(request):
    response_data = {}
    infoFCL = [model_to_dict(item) for item in InfoFCL.objects.all().order_by('puerto_cargue')]
    response_data['infoFCL'] = infoFCL;
    return HttpResponse(json.dumps(response_data), content_type="application/json")

def getParejasPuertosJSON_LCL(request):
    response_data = {}
    infoLCL = [model_to_dict(item) for item in InfoLCL.objects.all().order_by('puerto_cargue')]
    response_data['infoLCL'] = infoLCL;
    return HttpResponse(json.dumps(response_data), content_type="application/json")

def getCiudadesJSON(request, pais_cc_fips):
    response_data = {}
    todas_ciudades = [model_to_dict(item) for item in Ciudad.objects.filter(cc_fips=""+pais_cc_fips).order_by('nombre_ciudad')]
    response_data['todas_ciudades'] = todas_ciudades
    return HttpResponse(json.dumps(response_data), content_type="application/json")

def getTarifasHTTP(request):
    lista_tarifas = TarifasFijas.objects.all().order_by('nombre_tarifa')
    rta=""
    for cadaTarifa in lista_tarifas:
        rta = rta + "<option>"+cadaTarifa.nombre_tarifa+"</option>"
    return HttpResponse(rta)

def getDescripcionesJSON(request):
    response_data = {}
    todas_ids = [model_to_dict(item) for item in Descripcion.objects.order_by('idDescripcion')]
    response_data['todas_ids'] = todas_ids
    return HttpResponse(json.dumps(response_data), content_type="application/json")

def metodoPrincipal(request):
    if request.is_ajax():
        if request.method == 'POST':
            #Para coger un json de un request post
            str=request.POST['elUsuario'] #envien el json como un texto y el key es "elUsuario"
            str=str.replace("\\", "")[1:-1] #Viene con algo de ruido que hay que limpiar
            d = json.loads(str) #Se carga en esta estructura especial para json y ahora se puede acceder cada parametro ej: print d['telefono']
            #-------------------------------------------------
            response_data={}
            #PASO 1) Mirar si llegaron todos los parametros necesarios para realizar una cotizacion, en etapa1, los basicos
            infoBuscada=['paisDatos','ciudad_datos','correo','telefono','tipoEnvio','tipoProducto','paisProducto','valorMercancia','tipoMoneda','prdif','otm']
            noEncontradas=[]
            indice=0;
            for info in infoBuscada:
                if info not in d:
                    noEncontradas.append(info)
                indice+=1

            #PASO 2) se mira si falta algo y se informa
            if len(noEncontradas) > 0:
                #Si no ha llegado todo, se devuelve cuales faltan
                #TODO tengo que mirar como informo el error
                return HttpResponse(json.dumps(response_data), content_type="application/json", status=400)
            else:
                #Si todo llego, paso a una segunda etapa de revision
                if d['tipoEnvio']=="Via Maritima":
                    if 'tipoEnvio2' not in d:
                        #Si esto fallo el usuario intervino mi javascript asi que se le muestra un error no especificado
                        #TODO inventar un error no especificado
                        return HttpResponse(json.dumps(response_data), content_type="application/json", status=400)
                    else:
                        if d['tipoEnvio2']=="FCL":
                            arreglo20=d['arregloFCL_20']
                            arreglo40=d['arregloFCL_40']
                            infoNecesaria=InfoFCL.objects.get(id = d['idPuertosFCL'])
                            esOTM=d['otm']

                            parte4={} #La voy a usar para mandar los costos opcionales
                            #TODO:
                            response_data['parte4']=parte4

                            parte3={} #La voy a usar para mandar los costos fijos
                            parte3['Gastos fob']=infoNecesaria.gastos_fob
                            parte3['Gastos naviera']=infoNecesaria.gastos_naviera
                            parte3['Manejo']=infoNecesaria.manejo
                            parte3['Collect fee']=infoNecesaria.collect_fee
                            response_data['parte3']=parte3

                            parte2={} #La voy a usar para mandar los costos de la carga
                            parte2['Divisa']=infoNecesaria.divisa

                            multiplicador=1;
                            if infoNecesaria.divisa=="EUR":
                                resp = requests.get("http://api.fixer.io/latest?symbols=USD")
                                tazaCambioEUR_USD=json.loads(resp.text)['rates']['USD']
                                multiplicador=tazaCambioEUR_USD;
                            elif infoNecesaria.divisa=="USD":
                                multiplicador=1;

                            parte2['Costo Transoprte contenedores 20 ft']=(len(arreglo20)*infoNecesaria.FCL_20*multiplicador)
                            parte2['Costo Transoprte contenedores 40 ft']=(len(arreglo40)*infoNecesaria.FCL_40*multiplicador)
                            parte2['bl']=50 #TODO: crear variables globales
                            response_data['parte2']=parte2

                            parte1={} #La voy a usar para mandar la informacion del transporte
                            string=""
                            string+=infoNecesaria.puerto_cargue
                            string+=" - "
                            string+=infoNecesaria.pais
                            parte1['Origen']=string
                            parte1['Destino']=infoNecesaria.puerto_descargue
                            parte1['Servicio']=infoNecesaria.servicio
                            parte1['Tiempo de transito']=infoNecesaria.tiempo_transito
                            response_data['parte1']=parte1

                        elif d['tipoEnvio2']=="LCL":
                            infoNecesaria=InfoLCL.objects.get(id = d['idPuertosLCL'])
                            esOTM=d['otm']

                            parte4={} #La voy a usar para mandar los costos opcionales
                            #TODO:
                            response_data['parte4']=parte4

                            parte3={} #La voy a usar para mandar los costos fijos
                            response_data['parte3']=parte3

                            parte2={} #La voy a usar para mandar los costos de la carga
                            response_data['parte2']=parte2

                            parte1={} #La voy a usar para mandar la informacion del transporte
                            string=""
                            string+=infoNecesaria.puerto_cargue
                            string+=" - "
                            string+=infoNecesaria.pais
                            parte1['Origen']=string
                            parte1['Destino']=infoNecesaria.puerto_descargue
                            parte1['Servicio']=infoNecesaria.servicio
                            parte1['Tiempo de transito']=infoNecesaria.tiempo_transito
                            parte1['Frecuencia']=infoNecesaria.frecuencia
                            response_data['parte1']=parte1

                elif d['tipoEnvio']=="Via Aerea":
                    print("aereo")
                elif d['tipoEnvio']=="Proyecto Especial":
                    print("especial")
                return HttpResponse(json.dumps(response_data), content_type="application/json")
            #-------------------------------------------------
            print(noEncontradas)

def hacerCotizacion(request):
    if request.is_ajax():
        if request.method == 'POST':
            #Para coger un json de un request post
            str=request.POST['cotizacion'] #envien el json como un texto y el key es "elUsuario"
            str=str.replace("\\", "")[1:-1] #Viene con algo de ruido que hay que limpiar
            d = json.loads(str) #Se carga en esta estructura especial para json y ahora se puede acceder cada parametro ej: print d['telefono']
            #-------------------------------------------------
            elCorreo=d['correo']
            """
            send_mail('Subject here', 'Here is the message.', 'from@example.com',[elCorreo, 'correoDeMelyak@dominio.com'], fail_silently=False)
            """
            response_data=d
            return HttpResponse(json.dumps(response_data), content_type="application/json")
