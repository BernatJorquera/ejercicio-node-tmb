/* eslint-disable indent */
const chalk = require("chalk");
const inquirer = require("inquirer");
const { program } = require("commander");
require("dotenv").config();
const fetch = require("node-fetch");
const preguntas = require("./preguntas/preguntas");

/* seteando argumentos obtenidos */
program
  .option("-c, --color <color>", "Color con el que se muestran las líneas (formato de introducción: \"#000000\")")
  .option("-a, --abrev", "Usar abreviaturas de paradas");
program.parse(process.argv);
let color = program.opts().color;
const abrev = program.opts().abrev;
const urlLinias = `${process.env.TMB_API_URL}?app_id=${process.env.TMB_APP_ID}&app_key=${process.env.TMB_APP_KEY}`;

/* preguntando y esperando las respuestas */
inquirer.prompt([
  {
    type: "list",
    message: preguntas[0],
    name: "transporte",
    choices: ["Metro", "Bus"]
  },
  {
    type: "checkbox",
    message: preguntas[1],
    name: "informacion",
    choices: ["Coordenadas", "Fecha de inauguración"],
    when: (respuestas) => {
      if (respuestas.transporte === "Bus") {
        console.log(`${chalk.yellow("No tenemos información disponible sobre los buses. Para eso puedes consultar: ")}https://www.tmb.cat/ca/home`);
        process.exit(0);
      }
      return respuestas.transporte === "Metro";
    }
  },
  {
    type: "confirm",
    message: preguntas[2],
    name: "verbose"
  },
  {
    type: "input",
    message: preguntas[3],
    name: "linea"
  }
]).then(respuestas => {
  fetch(urlLinias)
    .then(resp => resp.json())
    .then(datos => lineasMultiples(respuestas, datos));
});

/* una vez tenemos respuestas y datos del primer fetch miramos si hay mas de una linea coincidente */
const lineasMultiples = async (respuestas, datos) => {
  const { linea: lineaSelec } = respuestas;
  const lineasExistentes = datos.features.map(feature => feature.properties.NOM_LINIA);
  let lineaExiste = false;
  const lineasCoincidentes = [];
  for (const i in lineasExistentes) {
    if (lineasExistentes[i].includes(lineaSelec)) {
      lineaExiste = lineaExiste ? true : lineasExistentes[i].includes(lineaSelec);
      lineasCoincidentes.push({ posicion: i, nombreLinea: lineasExistentes[i] });
    }
  }
  if (lineasCoincidentes.length > 1) {
    nuevaInquiry(respuestas, datos, lineasCoincidentes);
  } else {
    imprimeLinea(respuestas, datos, lineasCoincidentes, lineaExiste);
  }
};

/* solo se ejecuta si hay mas de una linea coincidente, sino pasa directo a imprimeLinea */
const nuevaInquiry = (respuestas, datos, lineas) => {
  inquirer.prompt([
    {
      type: "list",
      message: preguntas[4],
      name: "lineaMult",
      choices: lineas.map(linea => linea.nombreLinea)
    }
  ]).then(respuestaLinea => imprimeLinea(
    respuestas, datos, lineas.filter(linea => linea.nombreLinea === respuestaLinea.lineaMult), true
  ));
};

/* una vez hay una sola linea seleccionada se ejecuta esto */
const imprimeLinea = (respuestas, datos, linea, lineaExiste) => {
  if (!lineaExiste) {
    if (respuestas.verbose) {
      console.log(chalk.red.bold(`Error: la línea ${respuestas.linea} no existe.`));
    }
    process.exit(1);
  }
  const [{ posicion, nombreLinea }] = linea;
  color = color || `#${datos.features[posicion].properties.COLOR_LINIA}`;
  console.log(chalk.hex(color)(`${nombreLinea}: ${datos.features[posicion].properties.DESC_LINIA}`));
  const urlParadas = `${process.env.TMB_API_URL}/${datos.features[posicion].properties.CODI_LINIA}/estacions?app_id=${process.env.TMB_APP_ID}&app_key=${process.env.TMB_APP_KEY}`;
  fetch(urlParadas)
    .then(resp => resp.json())
    .then(paradas => imprimeParadas(respuestas, paradas));
};

/* una vez tenemos las paradas se imprimen */
const imprimeParadas = (respuestas, paradas) => {
  const paradasYOrden = paradas.features
    .map(feature => ({
      nombreEstacion: feature.properties.NOM_ESTACIO,
      orden: feature.properties.ORDRE_ESTACIO,
      coordenadas: feature.geometry.coordinates,
      fechaInauguracion: feature.properties.DATA_INAUGURACIO
    }))
    .sort((p1, p2) => p1.orden - p2.orden);
  /* eslint-disable-next-line array-callback-return */
  paradasYOrden.map(parada => {
    console.log(chalk.hex(color)(`${!abrev
      ? `${parada.nombreEstacion.length < 8
        ? `${parada.nombreEstacion}\t\t\t`
        : `${parada.nombreEstacion.length < 16
          ? `${parada.nombreEstacion}\t\t`
          : `${parada.nombreEstacion}\t`}`}`
      : `${parada.nombreEstacion.slice(0, 3).toUpperCase()}.`} ${respuestas.informacion.includes("Coordenadas")
        ? `${parada.coordenadas}\t`
        : ""}${respuestas.informacion.includes("Fecha de inauguración")
          ? parada.fechaInauguracion.slice(0, -1).split("-").reverse().join("-")
          : ""}`));
  });
};
