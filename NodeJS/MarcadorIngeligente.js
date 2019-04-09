var mqtt = require('mqtt')
var opciones = { username:'chepecarlos', password:'secretoespecial'}
var client = mqtt.connect('mqtt://broker.shiftr.io',opciones)

var GoogleSpreadsheet = require('google-spreadsheet');
var async = require('async');

var config = require('./config.js');
var doc = new GoogleSpreadsheet(config.ID);
var sheet;
var sheetInfo;
var creds = require('./ContrasenaApi.json'); //Descarga las ruta de console.google

doc.useServiceAccountAuth(creds, ActivandoGoogleDoct);
var CantidadMinion = 6;
var NombreMinion = ["chepecarlos"];

function ActivandoGoogleDoct() {
  console.log("Credenciar actividas");
  doc.getInfo(function(err, info) {
    console.log('Cargando documento: ' + info.title + ' de ' + info.author.email);
    var date = new Date();
    var Anno = date.getFullYear();
    var Mes = date.getMonth() + 1;
    var contador = 0;
    sheet = info.worksheets[0];
    //Buscar de hoja de mes/anno
    while (sheet.title != Mes + "/" + Anno) {
      contador++;
      sheet = info.worksheets[contador];
    }
    console.log("Hora activada: " + sheet.title);
  });

  BuscarCantidadMinion();
}

function BuscarCantidadMinion() {
  console.log("Buscando Cantidad de Minons");
  doc.getInfo(function(err, info) {
    var contador = 0;
    sheetInfo = info.worksheets[0];
    //Buscar de hoja de mes/anno
    while (sheetInfo.title != "INFO") {
      contador++;
      sheetInfo = info.worksheets[contador];
    }
    console.log("Hola de Inforacion: " + sheetInfo.title);

    sheetInfo.getCells({
      'min-row': 1,
      'max-row': 50,
      'min-col': 1,
      'max-col': 2,
      'return-empty': true
    }, function(err, cells) {
      var cell = cells[1];
      CantidadMinion = Number(cell.value);
      console.log("Cantidad Minion: " + CantidadMinion);
      for (var i = 0; i < CantidadMinion; i++) {
        var IDCelda = 3 + i * 2;
        var cell = cells[IDCelda];
        NombreMinion[i] = cell.value;
        console.log("Minion: " + i + " " + NombreMinion[i]);
      }
    });
  });

}

client.on('connect', function() {
  console.log("Conectado con mqtt");
  client.subscribe("ALSWEntrada");
  client.subscribe("ALSWSalida");
})
client.on('message', function(topic, message) {

  doc.getInfo(function(err, info) {
    console.log('Abiendo Archivo: ' + info.title + ' de ' + info.author.email);
    var date = new Date();
    var Anno = date.getFullYear();
    var Mes = date.getMonth() + 1;
    var contador = 0;
    sheet = info.worksheets[0];
    //Buscar de hoja de mes/anno
    while (sheet.title != Mes + "/" + Anno) {
      contador++;
      sheet = info.worksheets[contador];
    }
    console.log("Hora activada:" + sheet.title);
  });

  Listo = true;

  if (Listo) {
    // message is Buffer
    console.log("Informacion de " + topic + " usuario " + message.toString());

    var FechaActual = new Date();
    var Hora = FechaActual.getHours();
    var Minuto = FechaActual.getMinutes();
    var Segundo = FechaActual.getSeconds();
    var Dia = FechaActual.getDate();
    var ID = parseInt(message.toString());

    sheet.getCells({
      'min-row': 3, //Icio de Dia
      'max-row': 3 + 31, //Cantidad maxima de dias
      'min-col': 2,
      'max-col': 1 + CantidadMinion * 3,
      'return-empty': true
    }, function(err, cells) {

      var celda;
      if (topic.toString() == "ALSWEntrada") {
        celda = cells[(Dia - 1) * (CantidadMinion * 3) + ID * 3];
      } else if (topic.toString() == "ALSWSalida") {
        celda = cells[(Dia - 1) * (CantidadMinion * 3) + ID * 3 + 1];
      }
      celda.value = Hora + ":" + Minuto + ":" + Segundo;
      celda.save();
      console.log("Hora guarda: " + celda.value + " Minion " + NombreMinion[ID+1]);
      client.publish('ALSWMinion', NombreMinion[ID+1]);
    });
  }
})
