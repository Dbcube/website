// Tema bloqueado en oscuro: el sitio es solo dark y no se puede cambiar.
// Forzamos la preferencia a 'dark' por si quedó un valor 'light' guardado
// en localStorage de una visita anterior.
export default defineNuxtPlugin(() => {
  const colorMode = useColorMode();
  colorMode.preference = "dark";
  colorMode.value = "dark";
});
