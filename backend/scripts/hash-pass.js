// ...existing code...
import bcrypt from "bcryptjs";

const plain = "tecnicojoel";
const saltRounds = 10;

(async () => {
  try {
    const hash = await bcrypt.hash(plain, saltRounds);
    console.log(hash);
  } catch (err) {
    console.error("Error generando hash:", err);
    process.exit(1);
  }
})();
