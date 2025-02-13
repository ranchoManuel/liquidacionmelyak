/* global parseFloat */

//----------------------------------------------------------------------------------------------------------
//						PARTE 1: Obligatorios AJAX
//----------------------------------------------------------------------------------------------------------
// This function gets cookie with a given name
function getCookie(name)
{
    var cookieValue = null;
    if (document.cookie && document.cookie != '')
    {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++)
        {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) == (name + '='))
            {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

/*The functions below will create a header with csrftoken*/
function csrfSafeMethod(method)
{
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}
var csrftoken = getCookie('csrftoken');

function sameOrigin(url)
{
    // test that a given url is a same-origin URL
    // url could be relative or scheme relative or absolute
    var host = document.location.host; // host + port
    var protocol = document.location.protocol;
    var sr_origin = '//' + host;
    var origin = protocol + sr_origin;
    // Allow absolute or scheme relative URLs to same origin
    return(url == origin || url.slice(0, origin.length + 1) == origin + '/') ||
            (url == sr_origin || url.slice(0, sr_origin.length + 1) == sr_origin + '/') ||
            // or any other URL that isn't scheme relative or absolute i.e relative.
            !(/^(\/\/|http:|https:).*/.test(url));
}

$.ajaxSetup({
    beforeSend: function (xhr, settings)
    {
        if (!csrfSafeMethod(settings.type) && sameOrigin(settings.url))
        {
            // Send the token to same-origin, relative URLs only.
            // Send the token only if the method warrants CSRF protection
            // Using the CSRFToken value acquired earlier
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
        }
    }
});

//----------------------------------------------------------------------------------------------------------
//																					PARTE 2: Angularjs
//----------------------------------------------------------------------------------------------------------

//1) Preparacion del ambiente de Angular
var app = angular.module('appMelyak', []);
app.controller('ctrlMelyak', function ($scope)
{
    $scope.user = {};
    $scope.user.otm = false;
    $scope.user.seguro = false;
    //TODO: poner los valores que son.
    $scope.configTipoProducto = [{name: "Textiles", value: "Textiles"},
        {name: "Confecciones", value: "Confecciones"},
        {name: "Ferreteria", value: "Ferreteria"},
        {name: "Autopartes", value: "Autopartes"},
        {name: "Jugueteria", value: "Jugueteria"},
        {name: "Productos Medicos", value: "Productos Medicos"},
        {name: "Farmaceuticos", value: "Farmaceuticos"},
        {name: "Maquinaria Agricola", value: "Maquinaria Agricola"},
        {name: "Electricidad", value: "Electricidad"},
        {name: "peligrosa (IMO)", value: "peligrosa (IMO)"},
        {name: "Carga general no peligrosa", value: "Carga general no peligrosa"}];
    $scope.user.tipoProducto = $scope.configTipoProducto[0].value;
    //TODO: poner los valores que son.
    $scope.configTipoMoneda = [{name: "USD", value: "USD"}, {name: "COP", value: "COP"}, {name: "EUR", value: "EUR"}];
    $scope.user.tipoMoneda = $scope.configTipoMoneda[0].value;
    $scope.configTipoEnvio = [{name: "Via Maritima", value: "Via Maritima"}, {name: "Via Aerea", value: "Via Aerea"}, {name: "Proyecto Especial", value: "Proyecto Especial"}];
    $scope.configTipoEnvio2 = [{name: "Full Container Load (FCL)", value: "FCL"}, {name: "Less than Container Load (LCL)", value: "LCL"}];
    $scope.user.tipoEnvio2 = "";

    //Para pedir los pasises a la base de datos
    $.ajax({
        url: 'auxiliar/get/paisesAltJSON',
        type: "GET",
        success: function (json)
        {

            var data = json.todos_pais;
            
            $scope.$apply(function ()
            {
                $scope.configPais = data;
                $scope.user.paisDatos = $scope.configPais[40].nombre_pais;//El numero corresponde a Colombia (40)
                $scope.user.paisProducto = $scope.configPais[0].nombre_pais;
            });

            $scope.cambiarCiudades("Colombia"); //Para colombia es CO

            $("#boton1").removeAttr("disabled");
        }
    });

    //Para pedir la informacion de los puertos a la base de datos (FCL)
    $.ajax({
        url: 'auxiliar/get/getParejasPuertosJSON_FCL',
        type: "GET",
        success: function (json)
        {
            $scope.$apply(function ()
            {
                $scope.configParPuertosFCL = json.infoFCL;
                $scope.user.idPuertosFCL = $scope.configParPuertosFCL[0].id;
                $scope.puertoLlegadaFCL = $scope.configParPuertosFCL[0].puerto_descargue;
            });
        }
    });

    $scope.cambiarPuertosFCL = function (id)
    {
        for (var i = 0; i < $scope.configParPuertosFCL.length; i++)
        {
            if ($scope.configParPuertosFCL[i].id === id)
            {
                $scope.puertoLlegadaFCL = $scope.configParPuertosFCL[i].puerto_descargue;
                break;
            }
        }
    };

    //Para pedir la informacion de los puertos a la base de datos (LCL)
    $.ajax({
        url: 'auxiliar/get/getParejasPuertosJSON_LCL',
        type: "GET",
        success: function (json)
        {
            $scope.$apply(function ()
            {
                $scope.configParPuertosLCL = json.infoLCL;
                $scope.user.idPuertosLCL = $scope.configParPuertosLCL[0].id;
                $scope.puertoLlegadaLCL = $scope.configParPuertosLCL[0].puerto_descargue;
            });
        }
    });

    $scope.cambiarPuertosLCL = function (id)
    {
        for (var i = 0; i < $scope.configParPuertosLCL.length; i++)
        {
            if ($scope.configParPuertosLCL[i].id === id)
            {
                $scope.puertoLlegadaLCL = $scope.configParPuertosLCL[i].puerto_descargue;
                break;
            }
        }
    };
    
    $.ajax({
        url: 'auxiliar/get/getAeropuertosJSON',
        type: "GET",
        success: function (json)
        {
            $scope.$apply(function ()
            {
                $scope.configAeropuertos = json.infoAeropuertos;
                $scope.user.idAeropuerto = $scope.configAeropuertos[0].id;
            });
        }
    });

    var contenedores = [0, 0, 0];
    var nombres = ["20", "40", "Aereo"];
    //Cuando lo meto en un for se daña
    $("#slider" + nombres[0]).slider({max: 10}).slider("pips", {rest: "label"}).on("slidechange", function (e, ui) {
        $scope.crearCajas(ui, 0);
    });
    $("#slider" + nombres[1]).slider({max: 10}).slider("pips", {rest: "label"}).on("slidechange", function (e, ui) {
        $scope.crearCajas(ui, 1);
    });
    $("#slider" + nombres[2]).slider({max: 10}).slider("pips", {rest: "label"}).on("slidechange", function (e, ui) {
        $scope.crearCajas(ui, 2);
    });

    $scope.crearCajas = function (ui, index)
    {
        var hayQueArmar = ui.value - contenedores[index];
        if (hayQueArmar > 0)
        {
            var aPoner = contenedores[index] + 1;
            for (var i = 0; i < hayQueArmar; i++)
            {
                //Se crean diferentes cosas segun el contenedor
                var texto = "<div class='row' id='caja" + nombres[index] + "_" + aPoner + "'>";
                if (index === 0)
                    texto += "<i class='col-md-1 col-sm-1 col-xs-1 fa fa-cube'></i><p class='col-md-2 col-sm-2 col-xs-2'>" + aPoner + ":</p><input class='col-xs-8' id='FCL20_" + aPoner + "' type='number' min=0 value=0\>";
                else if (index === 1)
                    texto += "<i class='col-md-1 col-sm-1 col-xs-1 fa fa-cube'></i><p class='col-md-2 col-sm-6 col-xs-2'>" + aPoner + ":</p><input class='col-xs-8' id='FCL40_" + aPoner + "' type='number' min=0 value=0\>";
                else if (index === 2)
                {
                    //texto += "<p> Caja #" + aPoner + ":</p>";
                    texto += "<div class='row medidas'>";
                    texto += "  <div class='col-xs-3 input-group'>";
                    texto += "      <input id='Aereo_ancho" + aPoner + "' type='number' min='0' class='form-control cosasSerias' placeholder='X [m]' aria-describedby='basic-addonancho'>";
                    texto += "      <span class='input-group-addon' id='basic-addonancho" + aPoner + "'><i class='fa fa-arrows-h fa-lg'></i></span>";
                    texto += "  </div>";
                    texto += "  <div class='col-xs-3 input-group'>";
                    texto += "      <input id='Aereo_alto" + aPoner + "' type='number' min='0' class='form-control cosasSerias' placeholder='Y [m]' aria-describedby='basic-addonalto'>";
                    texto += "      <span class='input-group-addon' id='basic-addonalto" + aPoner + "'><i class='fa fa-arrows-v fa-lg'></i></span>";
                    texto += "  </div>";
                    texto += "  <div class='col-xs-3 input-group'>";
                    texto += "      <input id='Aereo_profundo" + aPoner + "' type='number' min='0' class='form-control cosasSerias' placeholder='Z [m]' aria-describedby='basic-addonprofundo'>";
                    texto += "      <span class='input-group-addon' id='basic-addonprofundo" + aPoner + "'><i class='fa fa-expand fa-lg'></i></span>";
                    texto += "  </div>";
                    texto += "  <div class='col-xs-3 input-group'>";
                    texto += "      <input id='Aereo_peso" + aPoner + "' type='number' min='0' class='form-control cosasSerias' placeholder='[Kg]' aria-describedby='basic-addonpeso'>";
                    texto += "      <span class='input-group-addon' id='basic-addonpeso" + aPoner + "'><i class='fa fa-balance-scale'></i></span>";
                    texto += "  </div>";
                    texto += "</div>";
                }
                texto += "</div>";
                $("#containers" + nombres[index]).append(texto);
                aPoner++;
            }
        } else if (hayQueArmar < 0)//Cuando tengo que quitar contenedores
        {
            var aQuitar = contenedores[index];
            hayQueArmar *= -1;
            for (var i = 0; i < hayQueArmar; i++)
            {
                var texto = "#caja" + nombres[index] + "_" + aQuitar;
                $(texto).remove();
                aQuitar--;
            }
        }
        contenedores[index] = ui.value;
        if (contenedores[0] !== 0 || contenedores[1] !== 0)
            $("#textosPreguntaPeso").css("display", "block");
        else
            $("#textosPreguntaPeso").css("display", "none");
    };

    //Este metodo se llama desde los botones de siguiente y anterior
    $scope.mostrarPag = function (pagina)
    {
        if (pagina === 2)
        {
            var pasa = true;
            if (angular.isUndefined($scope.user.nombre) || $scope.user.nombre === "") {
                pasa = false;
                $("#avisoNombre").css("display", "block");
            } else
                $("#avisoNombre").css("display", "none");
            if (angular.isUndefined($scope.user.correo) || $scope.user.correo === "") {
                pasa = false;
                $("#avisoCorreo").css("display", "block");
            } else
                $("#avisoCorreo").css("display", "none");
            if (angular.isUndefined($scope.user.telefono) || $scope.user.telefono === "") {
                pasa = false;
                $("#avisoTelefono").css("display", "block");
            } else
                $("#avisoTelefono").css("display", "none");
            if (angular.isUndefined($scope.user.ciudad_datos) || $scope.user.ciudad_datos === "") {
                pasa = false;
                $("#avisoCiudad").css("display", "block");
            } else
                $("#avisoCiudad").css("display", "none");

            if (pasa)
            {
                //Sobre aparecer las diferentes partes del formulario
                $("#Parte1").css("display", "none");
                $("#Parte2").css("display", "block");
                $("#Parte3").css("display", "none");
                //Sobre colorear las bolitas
                $("#bola1").attr("class", "bolitas primera apagada movidas");
                $("#bola2").attr("class", "bolitas segunda activa movidas");
                $("#bola3").attr("class", "bolitas tercera apagada");
                //Sobre los colores de los textos bajo las bolas
                $("#textoB1").css("color", "#909090");
                $("#textoB2").css("color", "#000000");
                $("#textoB3").css("color", "#909090");
                //Sobre los chulos
                $("#num1").css("display", "none");
                $("#bola1").css("padding-top", "5px");
                $("#chulo1").css("display", "block");
                $("#chulo1").css("color", "green");
            }
        } else if (pagina === 3)
        {
            var pasa = true, pasaFCL20 = true, pasaFCL40 = true, pasaAereo = true;
            //decide si mostrar o no cada uno de los errores de tipado
            if (angular.isUndefined($scope.user.valorMercancia) || $scope.user.valorMercancia === "" || $scope.user.valorMercancia == null) {
                pasa = false;
                $("#avisoValMerc").css("display", "block");
            } else
                $("#avisoValMerc").css("display", "none");
            if (angular.isUndefined($scope.user.prdif) || $scope.user.prdif === "" || $scope.user.prdif == null) {
                pasa = false;
                $("#avisoPrdif").css("display", "block");
            } else
                $("#avisoPrdif").css("display", "none");
            if (angular.isUndefined($scope.user.tipoEnvio) || $scope.user.tipoEnvio === "") {
                pasa = false;
                $("#avisoTipoEnvio").css("display", "block");
            } else {
                $("#avisoTipoEnvio").css("display", "none");
                if ($scope.user.tipoEnvio === "Via Maritima")
                {
                    if (angular.isUndefined($scope.user.tipoEnvio2) || $scope.user.tipoEnvio2 === "") {
                        pasa = false;
                        $("#avisoTipoEnvio2").css("display", "block");
                    } else {
                        $("#avisoTipoEnvio2").css("display", "none");

                        //El test de LCL
                        if ($scope.user.tipoEnvio2 === "LCL")
                        {
                            if (angular.isUndefined($scope.user.pesoLCL) || $scope.user.pesoLCL === "" || $scope.user.pesoLCL == null) {
                                pasa = false;
                                $("#avisoPesoLCL").css("display", "block");
                            } else
                                $("#avisoPesoLCL").css("display", "none");

                            if (angular.isUndefined($scope.user.anchoLCL) || $scope.user.anchoLCL === "" || $scope.user.anchoLCL == null) {
                                pasa = false;
                                $("#avisoDimensionesLCL").css("display", "block");
                            } else if (angular.isUndefined($scope.user.altoLCL) || $scope.user.altoLCL === "" || $scope.user.altoLCL == null) {
                                pasa = false;
                                $("#avisoDimensionesLCL").css("display", "block");
                            } else if (angular.isUndefined($scope.user.largoLCL) || $scope.user.largoLCL === "" || $scope.user.largoLCL == null) {
                                pasa = false;
                                $("#avisoDimensionesLCL").css("display", "block");
                            } else
                                $("#avisoDimensionesLCL").css("display", "none");
                        }
                    }
                } else if ($scope.user.tipoEnvio === "Proyecto Especial")
                {
                    if (angular.isUndefined($scope.user.textoEspecial) || $scope.user.textoEspecial === "" || $scope.user.textoEspecial == null) {
                        pasa = false;
                        $("#avisoTextoEspecial").css("display", "block");
                    } else
                        $("#avisoTextoEspecial").css("display", "none");
                }
            }

            //El test de Aereo, FCL20 y FCL40
            $scope.user.arregloFCL_20 = [];
            $scope.user.arregloFCL_40 = [];
            $scope.user.arregloAereo = [];
            for (var c = 0; c < 3; c++)
            {
                if (c===2 && $scope.user.tipoEnvio === "Via Martima") continue;
                if ((c === 0 || c === 1 ) && $scope.user.tipoEnvio === "Via Aerea") continue;
                
                revision: for (var i = 1; i <= contenedores[c]; i++)
                {
                    if (c === 0)
                    {
                        if ($.isNumeric($("#FCL20_" + i).val()))
                            $scope.user.arregloFCL_20.push($("#FCL20_" + i).val());
                        else
                        {
                            console.log("Falla FCL 20");
                            pasaFCL20 = false;
                            pasa = false;
                            $("#avisoFCL20").css("display", "block");
                            break revision;

                        }
                    } else if (c === 1)
                    {
                        if ($.isNumeric($("#FCL40_" + i).val()))
                            $scope.user.arregloFCL_40.push($("#FCL40_" + i).val());
                        else
                        {
                            console.log("Falla FCL 40");
                            pasaFCL40 = false;
                            pasa = false;
                            $("#avisoFCL40").css("display", "block");
                            break revision;
                        }
                    } else if (c === 2)
                    {
                        if ($.isNumeric($("#Aereo_ancho" + i).val()) && $.isNumeric($("#Aereo_alto" + i).val()) && $.isNumeric($("#Aereo_profundo" + i).val()) && $.isNumeric($("#Aereo_peso" + i).val()))
                        {
                            var caja = {ancho: $("#Aereo_ancho" + i).val(), alto: $("#Aereo_alto" + i).val(), profundo: $("#Aereo_profundo" + i).val(), peso: $("#Aereo_peso" + i).val()};
                            $scope.user.arregloAereo.push(caja);
                        } else
                        {
                            console.log("Falla Aereo");
                            pasaAereo = false
                            pasa = false;
                            $("#avisoAereo").css("display", "block");
                            break revision;
                        }
                    }
                }
            }
            if (pasaFCL20)
                $("#avisoFCL20").css("display", "none");
            if (pasaFCL40)
                $("#avisoFCL40").css("display", "none");
            if (pasaAereo)
                $("#avisoAereo").css("display", "none");

            if (pasa)
            {
                $("#Parte2").css("display", "none");
                $("#waitting").css("display", "block");
                $.ajax({
                    url: 'auxiliar/post/metodoPrincipal/', // the endpoint
                    type: "POST", // http method
                    data: {elUsuario: JSON.stringify(angular.toJson($scope.user))},
                    // handle a successful response
                    success: function (json)
                    {
                        $("#Parte1").css("display", "none");
                        $("#Parte2").css("display", "none");
                        //--------------Dependiendo del tipo de cotizacion-------------------
                        $("#Parte3").css("display", "block");
                        var tipoCotizacion;
                        if ($scope.user.tipoEnvio === "Via Aerea")
                            tipoCotizacion = "Via Aerea";
                        else if ($scope.user.tipoEnvio === "Via Maritima")
                        {
                            if ($scope.user.tipoEnvio2 === "FCL")
                                tipoCotizacion = "FCL";
                            else if ($scope.user.tipoEnvio2 === "LCL")
                                tipoCotizacion = "LCL";
                        } else if ($scope.user.tipoEnvio === "Proyecto Especial")
                            tipoCotizacion = "Proyecto Especial";

                        pintarPagina3(json, tipoCotizacion);
                        $scope.cotizacion = json;
                        //-------------------------------------------------------------------
                        $("#waitting").css("display", "none");
                        //Sobre colorear las bolitas
                        $("#bola1").attr("class", "bolitas primera apagada movidas");
                        $("#bola2").attr("class", "bolitas segunda apagada movidas");
                        $("#bola3").attr("class", "bolitas tercera activa");
                        //Sobre los colores de los textos bajo las bolas
                        $("#textoB1").css("color", "#909090");
                        $("#textoB2").css("color", "#909090");
                        $("#textoB3").css("color", "#000000");
                        //Sobre los chulos
                        $("#num2").css("display", "none");
                        $("#bola2").css("padding-top", "5px");
                        $("#chulo2").css("display", "block");
                        $("#chulo2").css("color", "green");
                    },
                    // handle a non-successful response
                    error: function (xhr, errmsg, err)
                    {
                        $('body').html("<div class='alert-box alert radius' data-alert>Oops! We have encountered an error: " + errmsg +
                                " <a href='#' class='close'>&times;</a></div>"); // add the error to the dom
                        console.log(xhr.status + ": " + xhr.responseText); // provide a bit more info about the error to the console
                    }
                });
            }
        }
    };

    $scope.cambiarCiudades = function (cc_fips)
    {
        if (cc_fips === "")
            $("#ciudad_datos").html("");
        else
        {
            var laUrl = "auxiliar/get/JSONAlt_" + cc_fips.replace(" ","0");
            $.ajax({
                url: laUrl,
                type: "GET",
                success: function (json)
                {
                    var data = json.todas_ciudades;
                    $scope.$apply(function ()
                    {
                        $scope.configCiudad = data;
                        if (cc_fips === "Colombia")
                            $scope.user.ciudad_datos = $scope.configCiudad[5].nombre_ciudad;//: El numero corresponde a Bogota es (1279)
                        else
                            $scope.user.ciudad_datos = $scope.configCiudad[0].nombre_ciudad;
                        $("#icono_datos").css("display", "none");
                        $("#boton1").removeAttr("disabled");
                    });
                },

        // handle a non-successful response
        error : function(xhr,errmsg,err) {
            $('#results').html("<div class='alert-box alert radius' data-alert>Oops! We have encountered an error: "+errmsg+
                " <a href='#' class='close'>&times;</a></div>"); // add the error to the dom
            console.log(xhr.status + ": " + xhr.responseText); // provide a bit more info about the error to the console
        }
            });
            $("#icono_datos").css("display", "block");
            $("#boton1").attr("disabled", "true");
        }
    };

    $scope.enviarLiquidacion = function () {
        
        $("#waitting").css("display", "block");
        $("#Parte3").css("display", "none");
        
        $scope.cotizacion.infoUser = $scope.user;
        $.ajax({
            url: 'auxiliar/post/hacerCotizacion/', // the endpoint
            type: "POST", // http method
            data: {cotizacion: JSON.stringify(angular.toJson($scope.cotizacion))},
            // handle a successful response
            success: function (json)
            {
                $("#waitting").css("display", "none");
                $("#Parte3").css("display", "block");
                bootbox.dialog({
                    title: "Envio Exitoso",
                    message: '<center><img src="../static/img/logo.png"/><br/>Enviamos tu aproximación presupuestal a tu correo.</center>'
                });
            },
            // handle a non-successful response
            error: function (xhr, errmsg, err)
            {
                $("#waitting").css("display", "none");
                $("#Parte3").css("display", "block");
                bootbox.dialog({
                    title: "Envio Fallido",
                    message: '<center><i class="fa fa-times fa-5x" style="color:#e74c3c;"></i></center><br/>Tuvimos un problema enviando la aproximación presupuestal a tu correo.'
                });
                console.log(xhr.status + ": " + xhr.responseText); // provide a bit more info about the error to 
            }
        });
    };

    $scope.cambiarTipoEnvio = function (tipoEnvio)
    {
        if (tipoEnvio === "Via Aerea")
        {
            $("#proyectoEspecial").css("display", "none");
            $("#TipoEnvioBarco").css("display", "none");
            $(".maritimo").css("display", "none");
            $("#envioAereo").css("display", "block");
            $("#part2_cuadrado1").css("padding-bottom", "6px");
        } else if (tipoEnvio === "Proyecto Especial")
        {
            $("#proyectoEspecial").css("display", "block");
            $("#TipoEnvioBarco").css("display", "none");
            $(".maritimo").css("display", "none");
            $("#part2_cuadrado1").css("padding-bottom", "6px");
            $("#envioAereo").css("display", "none");
        } else if (tipoEnvio === "Via Maritima")
        {
            $("#proyectoEspecial").css("display", "none");
            $("#envioAereo").css("display", "none");
            $("#TipoEnvioBarco").css("display", "block");
            $("#part2_cuadrado1").css("padding-bottom", "20px");
            if (angular.isDefined($scope.user.tipoEnvio2))
            {
                if ($scope.user.tipoEnvio2 === "FCL")
                {
                    $("#maritimoFCL").css("display", "block");
                    $("#maritimoLCL").css("display", "none");
                } else if ($scope.user.tipoEnvio2 === "LCL")
                {
                    $("#maritimoFCL").css("display", "none");
                    $("#maritimoLCL").css("display", "block");
                }
            }
        } else if (tipoEnvio === "FCL")
        {
            $("#maritimoFCL").css("display", "block");
            $("#maritimoLCL").css("display", "none");
        } else if (tipoEnvio === "LCL")
        {
            $("#maritimoFCL").css("display", "none");
            $("#maritimoLCL").css("display", "block");
        }
    };
});

function pintarPagina3(json, tipoCotizacion)
{
    var contenido = "";
    var textospar3 = ["1. Informacion del transporte", "2. Costos de la Carga", "3. Costos Fijos", "4. Costos Opcionales"];
    if (tipoCotizacion === "FCL" || tipoCotizacion === "LCL" || tipoCotizacion === "Aerea")
    {
        var k, keys = [];
        for (k in json)
            if (json.hasOwnProperty(k))
                keys.push(k);

        keys.sort();
        var granTotal = 0;

        for (var i = 0; i < keys.length; i++)
        {
            k = keys[i];
            contenido += "<div id='part3_cuadrado" + (i + 1) + "' class='cuadrado'>";
            contenido += "<span class='dato agrandado escondido uppercase titulo-seccion'>" + textospar3[i] + "</span><br/><br/>";

            var total = 0;
            //console.log(k);
            for (var key in json[k])
            {
                //if(json[k].hasOwnProperty(key)) console.log("    "+key + " -> " + json[k][key]);
                if (key === "Divisa")
                    continue;
                contenido += "<div class='row'>";
                if ($.isNumeric(json[k][key]) && i > 0)
                {
                    var valorAPoner = parseFloat(Math.round(json[k][key] * 100) / 100).toFixed(2);
                    contenido += "<span id='" + key.replace(/_/g, "") + "' class='dato col-md-7 col-sm-7 col-xs-7'>" + key.replace(/_/g, " ") + "</span><span class='dato derecha col-md-5 col-sm-5 col-xs-5 textoGris'>$ " + valorAPoner + "</span>";
                    total += json[k][key];
                } else
                    contenido += "<span id='" + key.replace(/_/g, "") + "' class='dato col-md-7 col-sm-7 col-xs-7'>" + key.replace(/_/g, " ") + "</span><span class='dato derecha col-md-5 col-sm-5 col-xs-5 textoGris'>" + json[k][key] + "</span>";
                contenido += "</div>";
            }
            if (i > 0) //No se espera que el primero tenga un total porque es el de informacion general
            {
                contenido += "<div class='row'>";
                contenido += "<span class='dato col-md-9 col-sm-9 col-xs-9 total'>Total</span><span class='dato derecha col-md-3 col-sm-3 col-xs-3 conNegrilla'>$ " + parseFloat(Math.round(total * 100) / 100).toFixed(2) + "</span>";
                contenido += "</div>";
            }
            contenido += "</div>";
            granTotal += total;
        }
        contenido += "<div id='part3_cuadradoVerde' class='cuadrado'>";
        contenido += "	<div class='row'>";
        contenido += "      <span class='dato col-md-7 col-sm-7 col-xs-7 textoBlanco conNegrilla'>Total liquidación costos de importación</span><span class='dato derecha col-md-5 col-sm-5 col-xs-5 textoGris textoBlanco conNegrilla'>$ " + parseFloat(Math.round(granTotal * 100) / 100).toFixed(2) + "</span>";
        contenido += "	</div>";
        contenido += "</div>";
    } else if (tipoCotizacion === "Proyecto Especial")
    {
        $("#part3_cuadrado_lado1").css("display","none");
        contenido = "<div id='part3_cuadrado1' class='cuadrado'>";
        contenido += "  <span class='dato agrandado escondido uppercase'>1. Aviso</span><br/><br/>";
        contenido += "  <p>Tu cotización llegará a nosotros cuando envíes el correo. Te daremos una respuesta tan pronto como sea posible.</p>";
        contenido += "</div>";
    }
    $("#zonaCentro").html(contenido);
    invocar_Descripciones();
}

//----------------------------------------------------------------------------------------------------------
//																							LOL
//----------------------------------------------------------------------------------------------------------

//3) Tiene que ver con como se pegaron las descripciones para la pagina 3
var idPaDescripcion = [];
var texto = [];

function invocar_Descripciones()
{
    $.ajax({
        url: "auxiliar/get/descripcionesJSON",
        type: "GET",
        success: function (json)
        {
            var data = json.todas_ids;
            for (var i = 0; i < data.length; i++)
            {
                idPaDescripcion.push(data[i].idDescripcion.replace(/\s/g, ""));
                texto.push(data[i].descripcion);
            }

            document.getElementById("zonaCentro").onmouseleave = function () {
                $("#textoInformacion").html("Situa el puntero encima de cualquier item para ver más información");
            };
            for (var i = 0; i < texto.length; i++)
                pegarDescripcion(i);
        },
        error: function (xhr, errmsg, err)
        {
            $('body').html("<div class='alert-box alert radius' data-alert>Oops! We have encountered an error: " + errmsg +
                    " <a href='#' class='close'>&times;</a></div>"); // add the error to the dom
            console.log(xhr.status + ": " + xhr.responseText); // provide a bit more info about the error to the console
        }
    });
}

function pegarDescripcion(i)
{
    if ($("#" + idPaDescripcion[i]).length > 0)//it exist
    {
        document.getElementById("" + idPaDescripcion[i]).onmouseover = function ()
        {
            $("#textoInformacion").html("" + texto[i]);
            $("#" + idPaDescripcion[i]).css("color", "#999999");
        };
        document.getElementById("" + idPaDescripcion[i]).onmouseleave = function () {
            $("#" + idPaDescripcion[i]).css("color", "black");
        };
    }
}

document.getElementById("valorMercancia").addEventListener("focusout", SoloDejarPositivosDecimal, false);
document.getElementById("prdif").addEventListener("input", SoloDejarPositivos, false);

function SoloDejarPositivos()
{
    // Let's match only digits.
    var num = this.value.match(/^\d+$/);
    if (num === null)
        this.value = "";
    // If we have no match, value will be empty.
}

function SoloDejarPositivosDecimal()
{
    // Let's match only digits.
    var num = this.value.match(/^\d+$/);
    if (num === null)
    {
        num = this.value.match(/^\d+\.\d+$/);
        if (num === null)
            this.value = "";
    }
    // If we have no match, value will be empty.
}


function mostrarDropdown(idSelect)
{
    console.log(idSelect);
    var dropdown = $("#" + idSelect)[0];
    var event = document.createEvent('MouseEvents');
    event.initMouseEvent('mousedown', true, true, window);
    dropdown.dispatchEvent(event);
}
