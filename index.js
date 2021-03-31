const chalk = require("chalk");
const inquirer = require("inquirer");
const { program } = require("commander");
require("dotenv").config();
const preguntas = require("./preguntas/preguntas");

program
  .option("-c, --color <color>", "Color con el que se muestran las líneas (formato de introducción: \"#000000\")")
  .option("-a, --abrev", "Usar abreviaturas de paradas");
program.parse(process.argv);
const { color, abrev } = program.opts();
console.log(process.env.TMB_API_URL);

/* console.log(chalk.hex('#1890FF')('prettier success!')) */

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
]).then(respuestas => console.log(respuestas));
