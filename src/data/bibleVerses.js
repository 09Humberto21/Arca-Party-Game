/**
 * bibleVerses.js — Versículos bíblicos motivacionales (MASTER_PLAN).
 * Se muestra uno aleatorio en la DefeatScreen para animar al jugador.
 * Categorizados por tema: fuerza, ánimo, protección, perseverancia.
 */
export const BIBLE_VERSES = [
  { ref: 'Josué 1:9', text: 'Esfuérzate y sé valiente; no temas ni desmayes, porque Jehová tu Dios estará contigo dondequiera que vayas.', cat: 'fuerza' },
  { ref: 'Isaías 43:2', text: 'Cuando pases por las aguas, yo estaré contigo; y si por los ríos, no te anegarán.', cat: 'proteccion' },
  { ref: 'Filipenses 4:13', text: 'Todo lo puedo en Cristo que me fortalece.', cat: 'fuerza' },
  { ref: 'Salmos 23:4', text: 'Aunque ande en valle de sombra de muerte, no temeré mal alguno, porque tú estarás conmigo.', cat: 'proteccion' },
  { ref: 'Isaías 41:10', text: 'No temas, porque yo estoy contigo; no desmayes, porque yo soy tu Dios que te esfuerzo.', cat: 'animo' },
  { ref: 'Jeremías 29:11', text: 'Yo sé los pensamientos que tengo acerca de vosotros, pensamientos de paz y no de mal, para daros el fin que esperáis.', cat: 'esperanza' },
  { ref: 'Romanos 8:28', text: 'A los que aman a Dios, todas las cosas les ayudan a bien.', cat: 'esperanza' },
  { ref: 'Salmos 46:1', text: 'Dios es nuestro amparo y fortaleza, nuestro pronto auxilio en las tribulaciones.', cat: 'fuerza' },
  { ref: 'Mateo 19:26', text: 'Para los hombres esto es imposible; mas para Dios todo es posible.', cat: 'esperanza' },
  { ref: '2 Timoteo 1:7', text: 'No nos ha dado Dios espíritu de cobardía, sino de poder, de amor y de dominio propio.', cat: 'fuerza' },
  { ref: 'Salmos 27:1', text: 'Jehová es mi luz y mi salvación, ¿de quién temeré?', cat: 'proteccion' },
  { ref: 'Proverbios 3:5', text: 'Fíate de Jehová de todo tu corazón, y no te apoyes en tu propia prudencia.', cat: 'confianza' },
  { ref: 'Isaías 40:31', text: 'Los que esperan a Jehová tendrán nuevas fuerzas; levantarán alas como las águilas.', cat: 'animo' },
  { ref: 'Gálatas 6:9', text: 'No nos cansemos de hacer bien, porque a su tiempo segaremos, si no desmayamos.', cat: 'perseverancia' },
  { ref: 'Deuteronomio 31:6', text: 'Esforzaos y cobrad ánimo; no temáis, porque Jehová tu Dios es el que va contigo.', cat: 'fuerza' },
  { ref: 'Salmos 121:2', text: 'Mi socorro viene de Jehová, que hizo los cielos y la tierra.', cat: 'proteccion' },
  { ref: '1 Corintios 16:13', text: 'Velad, estad firmes en la fe; portaos varonilmente, y esforzaos.', cat: 'perseverancia' },
  { ref: 'Filipenses 4:6', text: 'Por nada estéis afanosos; sino sean conocidas vuestras peticiones delante de Dios.', cat: 'paz' },
  { ref: 'Santiago 1:12', text: 'Bienaventurado el varón que soporta la tentación; porque cuando haya resistido, recibirá la corona de vida.', cat: 'perseverancia' },
  { ref: 'Salmos 31:24', text: 'Esforzaos todos vosotros los que esperáis en Jehová, y tome aliento vuestro corazón.', cat: 'animo' },
  { ref: 'Nehemías 8:10', text: 'No os entristezcáis, porque el gozo de Jehová es vuestra fuerza.', cat: 'animo' },
  { ref: 'Romanos 8:37', text: 'En todas estas cosas somos más que vencedores por medio de aquel que nos amó.', cat: 'victoria' },
]

/** Devuelve un versículo aleatorio. */
export function randomVerse() {
  return BIBLE_VERSES[Math.floor(Math.random() * BIBLE_VERSES.length)]
}
