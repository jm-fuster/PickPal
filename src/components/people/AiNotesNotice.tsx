import Link from "next/link";

/**
 * Aviso junto a los campos de texto libre que alimentan el prompt de la IA.
 *
 * Existe por una razón legal, no decorativa: las notas se envían a Google
 * (Gemini) al generar ideas y PickPal usa la capa gratuita de esa API, donde
 * Google puede usar el contenido para entrenar sus modelos y revisores humanos
 * pueden leerlo. La transparencia (RGPD art. 13) tiene que estar donde el
 * usuario escribe, no solo enterrada en `/privacidad`.
 *
 * Desde que las fichas se pueden compartir (docs/dudas.md → decisión 8), el
 * texto también avisa de quien tenga acceso a la ficha: cambiar quién la lee
 * sin tocar este aviso sería romper la promesa que hace. Las notas se ven
 * enteras porque son justo la información que hace útil colaborar (decisión
 * 2) — ocultarlas dejaría la ficha compartida a medias.
 *
 * Va en los DOS sitios donde se editan notas —alta (`PersonForm`) y ficha
 * (`/seres-queridos/[personId]`)— y por eso vive en un componente: el texto no
 * puede divergir entre ambos. Si se migra a la capa de pago de Gemini,
 * actualizar este texto junto con `/privacidad` y `docs/privacy.md` §4.1.
 */
export function AiNotesNotice() {
  return (
    <p className="text-xs text-muted-foreground">
      Al generar ideas, las notas se envían a la IA de Google. Si compartes
      esta ficha, quien tenga acceso también las verá. No escribas nada que no
      quieras compartir con ninguno de los dos.{" "}
      <Link
        href="/privacidad"
        className="underline underline-offset-2 hover:text-foreground"
      >
        Cómo tratamos estos datos
      </Link>
      .
    </p>
  );
}
