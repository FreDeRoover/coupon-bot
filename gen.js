// Default list for Belgium (nl-BE and fr-BE), most likely first. Sources: Belgian
// shop welcome offers (BIENVENUE10 at zooplus.be, NEW10 at otakucenter.be) and
// coupon-site rankings (WELCOME*, BLACKFRIDAY*, SAVE*). Other entries are common
// conventions, not ranked data.
const pct = (w, p) => p.map((n) => w + n);
const P = ["10", "15", "20", "5", "25", "30"];
const DEFAULT = [
  ...pct("WELKOM", [...P, "", "10EURO"]),
  ...pct("BIENVENUE", [...P, ""]),
  ...pct("NEW", ["10", "15", "20", "5"]), ...pct("NIEUW", ["10", "15", "20"]),
  ...pct("NIEUWSBRIEF", ["10", "15", "20", ""]), ...pct("NEWSLETTER", ["10", "15", "20", ""]),
  ...pct("EERSTE", ["10", "15", "20"]), ...pct("PREMIERE", ["10", "15", "20"]),
  ...pct("WELCOME", [...P, "", "BACK", "2026"]),
  ...pct("BLACKFRIDAY", ["", "10", "15", "20", "25", "30", "2026"]), "BF", "BF10", "BF20",
  ...pct("CYBERMONDAY", ["", "10", "15", "20"]), "CM", "SINGLESDAY", "SINGLESDAY11",
  ...pct("SOLDEN", ["", "10", "15", "20"]), ...pct("SOLDES", ["", "10", "15", "20"]),
  "ZOMERSOLDEN", "WINTERSOLDEN", "ZOMERSALE", "WINTERSALE",
  ...pct("KORTING", ["10", "15", "20", "5"]), ...pct("PROMO", ["10", "15", "20", "5"]),
  ...pct("REDUCTION", ["10", "15"]), ...pct("REMISE", ["10", "15"]),
  ...pct("SAVE", ["10", "15", "20", "5", "25", "30"]), ...pct("FIRST", ["10", "15", "20"]),
  "FIRSTORDER", "NEWCUSTOMER", "NEWCUSTOMER10", "FIRSTBUY",
  ...pct("HELLO", ["10", "15", "20"]), ...pct("SIGNUP", ["10", "15", ""]),
  ...pct("VIP", ["10", "15", "20", ""]), ...pct("APP", ["5", "10"]),
  ...pct("THANKS", ["10", "15"]), "MERCI10", "BEDANKT10", "THANKYOU10",
  "GRATISVERZENDING", "VERZENDGRATIS", "GRATISVERZENDING10", "LIVRAISONGRATUITE", "FREESHIP", "FREESHIPPING",
  ...pct("ZOMER", ["10", "15", "20"]), "SINTERKLAAS", "SINT10", "KERST10", "KERST15", "NIEUWJAAR",
  "PAASEN10", "MOEDERDAG", "MOEDERDAG10", "VADERDAG", "VADERDAG10", "VALENTIJN", "VALENTIJN10",
  "BELGIE10", "BELGIE", "BELGIQUE10", "BELGIQUE",
];
// Shop-name guesses (NIKE10...) go first, then the default list
export const common = (extra = []) => [...new Set([
  ...extra.map((w) => w.trim().toUpperCase()).filter(Boolean).flatMap((w) => pct(w, ["10", "15", "20", "5"])),
  ...DEFAULT,
])];
