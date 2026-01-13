const themes = process.env.THEMES;

export default function themeDarkness(name) {
  return themes.dark.indexOf(name) !== -1 ? "dark" : "light";
}
