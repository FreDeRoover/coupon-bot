import { generate } from "./gen.js";

const $ = (id) => document.getElementById(id);
const sync = () => ($("secretRow").hidden = $("algo").value !== "signed");
$("algo").onchange = sync;

$("go").onclick = async () => {
  $("err").textContent = "";
  try {
    $("out").value = (await generate({
      algo: $("algo").value,
      count: Math.min(+$("count").value || 1, 1000),
      length: +$("length").value || 8,
      prefix: $("prefix").value.trim().toUpperCase(),
      secret: $("secret").value,
    })).join("\n");
  } catch (e) { $("err").textContent = e.message; }
};

$("copy").onclick = () => navigator.clipboard.writeText($("out").value);
