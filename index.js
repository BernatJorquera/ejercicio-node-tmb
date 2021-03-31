const chalk = require("chalk");
const inquirer = require("inquirer");
const { program } = require("commander");

inquirer.prompt([
  {
    type: "list",
    message: "¿Qué tipo de transporte quieres usar?",
    name: "transporte",
    choices: ["Metro", "Bus"]
  },
  {
    type: "checkbox",
    message: "¿Qué información extra quiere obtener de cada parada?",
    name: "informacion",
    choices: ["Coordenadas", "Fecha de inauguración"],
    when: (respuestas) => {
      if (respuestas.transporte === "Bus") {
        console.log(`${chalk.yellow("No tenemos información disponible sobre los buses. Para eso puedes consultar: ")}https://www.tmb.cat/ca/home`);
        process.exit(0);
      }
      return respuestas.transporte === "Metro";
    }
  }
]).then(respuestas => console.log(respuestas));
