export function formatPersonName(value: unknown) {
  const normalized = String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("pt-BR");

  if (!normalized) return "";

  let capitalizeNext = true;
  let output = "";

  for (const character of normalized) {
    if (/\p{L}/u.test(character)) {
      output += capitalizeNext ? character.toLocaleUpperCase("pt-BR") : character;
      capitalizeNext = false;
      continue;
    }

    output += character;
    capitalizeNext = character === " " || character === "-" || character === "'" || character === "’";
  }

  return output;
}
