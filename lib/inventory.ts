export function parseInventoryCSV(text: string) {
  const lines = text
    .replace(/^\uFEFF/, "")
    .trim()
    .split(/\r?\n/)
    .filter((l) => l.trim());
  if (lines.length < 2)
    throw new Error("El archivo debe incluir encabezados y al menos una fila.");
  if (lines.length > 501) throw new Error("Máximo 500 filas por importación.");
  const delimiter = lines[0].includes(";") ? ";" : ",";
  const head = lines[0].split(delimiter).map((x) => x.trim().toLowerCase());
  if (
    head[0] !== "sku" ||
    head[1] !== "stock" ||
    (head[2] && head[2] !== "price") ||
    head.length > 3
  )
    throw new Error("Encabezado esperado: sku,stock,price");
  const seen = new Set<string>();
  return lines.slice(1).map((line, i) => {
    const cols = line.split(delimiter).map((x) => x.trim());
    const [sku, s, p] = cols;
    const stock = Number(s);
    if (
      cols.length !== head.length ||
      !sku ||
      !/^[\w-]{1,64}$/.test(sku) ||
      s === "" ||
      !Number.isSafeInteger(stock) ||
      Math.abs(stock) > 100000
    )
      throw new Error(`Fila ${i + 2}: SKU o cantidad no válidos.`);
    if (seen.has(sku)) throw new Error(`SKU duplicado: ${sku}`);
    seen.add(sku);
    if (
      p !== undefined &&
      p !== "" &&
      (!Number.isSafeInteger(Number(p)) ||
        Number(p) < 0 ||
        Number(p) > 100000000)
    )
      throw new Error(`Fila ${i + 2}: precio no válido.`);
    return {
      sku,
      stock,
      ...(p !== undefined && p !== "" ? { price: Number(p) } : {}),
    };
  });
}
