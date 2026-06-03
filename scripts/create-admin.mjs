// Cria (ou promove) um usuário administrador.
// Uso:  npm run create-admin
// O Prisma e o bcrypt fazem o trabalho pesado; este script só pergunta os dados.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const prisma = new PrismaClient();

async function ask(rl, question, { required = true } = {}) {
  while (true) {
    const answer = (await rl.question(question)).trim();
    if (answer || !required) return answer;
    console.log("  -> Esse campo é obrigatório.");
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error(
      "\n  DATABASE_URL não encontrada. Rode com: npm run create-admin\n" +
        "  (esse comando carrega o arquivo .env automaticamente).\n"
    );
    process.exit(1);
  }

  const rl = readline.createInterface({ input, output });
  console.log("\n=== Criar usuário administrador ===\n");

  const name = await ask(rl, "Nome: ");
  const email = (await ask(rl, "Email: ")).toLowerCase();
  let password = await ask(rl, "Senha (mín. 6 caracteres): ");
  while (password.length < 6) {
    console.log("  -> A senha precisa ter ao menos 6 caracteres.");
    password = await ask(rl, "Senha (mín. 6 caracteres): ");
  }
  rl.close();

  const hash = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { name, password: hash, role: "admin" },
    });
    console.log(`\n✓ Usuário "${email}" atualizado e promovido a admin.\n`);
  } else {
    await prisma.user.create({
      data: { name, email, password: hash, role: "admin" },
    });
    console.log(`\n✓ Admin "${email}" criado com sucesso.\n`);
  }
}

main()
  .catch((err) => {
    console.error("\nErro:", err.message, "\n");
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
