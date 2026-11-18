// Pregunta el nombre de la tienda y lo guarda en .env.local (en UTF-8, con tildes y ñ).
// Lo usa instalar.bat. Si .env.local ya existe, no lo toca.
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";

const file = path.join(process.cwd(), ".env.local");
if (fs.existsSync(file)) process.exit(0);

const DEFAULT_NAME = "Mi tienda deportiva";
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const answer = await rl.question(`Nombre de la tienda (Enter para dejar "${DEFAULT_NAME}"): `);
rl.close();

// Una sola línea, sin comillas ni saltos, para que el archivo siempre quede válido.
const name = answer.replace(/[\r\n"'\\]/g, " ").trim() || DEFAULT_NAME;
fs.writeFileSync(file, `STORE_NAME=${name}\n`, "utf8");
console.log(`Listo: la tienda se llama "${name}". Puedes cambiarlo editando el archivo .env.local.`);
