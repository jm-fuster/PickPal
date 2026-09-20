# Encargo: compartir personas entre usuarios

Pásale esto a quien vaya a implementarlo. Es autosuficiente: no hace falta la
conversación en la que se decidió.

---

Implementa **compartir personas entre usuarios** en PickPal (Next 16 + Convex +
Clerk). El diseño ya está decidido; no lo rediscutas.

**Lee primero, en este orden:**

1. `AGENTS.md` — reglas del proyecto. Las que más te van a afectar: leer
   `convex/_generated/ai/guidelines.md` antes de tocar Convex, y `docs/security.md`
   antes de añadir mutations, rutas o variables de entorno.
2. `docs/dudas.md` → entrada **«Compartir personas entre usuarios»**. Son las diez
   decisiones con su porqué. Esa entrada es la especificación.

**El caso de uso:** tres hermanos comparten la ficha de sus padres. Lo que
justifica la función es que el historial de regalos alimenta la generación de
ideas, así que compartirlo evita que la IA proponga lo que ya regaló otro.

## Qué hay que construir

1. **Tabla de enlace** `(personId, clerkUserId, rol)` con sus índices.
2. **Reescribir las 15 comprobaciones de propiedad** para que acepten propiedad
   **o** invitación. Están en cinco archivos: `convex/giftHistory.ts` (4),
   `people.ts` (3), `recommendations.ts` (3), `savedIdeas.ts` (3) e
   `importantDates.ts` (2), todas con la forma `x.clerkUserId !== clerkUserId`.
3. **Transferencia de propiedad en `account.deleteMyAccount`** en lugar del
   borrado en cascada actual, cuando la ficha esté compartida.
4. **Frase nueva en `src/components/people/AiNotesNotice.tsx`**: hoy dice que las
   notas se envían a la IA de Google y que no escribas nada que no quieras
   compartir «con ella». Con la compartición eso pasa a ser falso.
5. **Pantalla de invitar** que diga qué se comparte **antes** de compartirlo.
6. **Actualizar `/privacidad`** (`src/app/privacidad/page.tsx`) y
   `docs/privacy.md` en el mismo commit.

## Empieza por el punto 3

Es el único que toca código ya desplegado. `deleteMyAccount` hoy borra en cascada
las personas del usuario; si lo dejas para el final existe una ventana en la que
cerrar una cuenta **destruye datos de otra persona**, y eso no se arregla con un
parche posterior porque los datos ya no están.

## Trampas de este repo que te ahorran una tarde

- **CI no corre el linter ni `next build`.** Antes de dar nada por bueno:
  `npm test`, `npx tsc --noEmit`, **`npx tsc -p convex/tsconfig.json --noEmit`** y
  `npm run lint`. El segundo typecheck no es redundante: Convex tiene su propio
  tsconfig y hay errores que pasan vitest y revientan el deploy en Vercel.
- **Los tests de Convex necesitan el runtime de edge.** Cada archivo abre con:
  ```ts
  /// <reference types="vite/client" />
  // @vitest-environment edge-runtime
  ```
  `convex/auth.test.ts` es el ejemplo más corto. Ya existen siete archivos de test
  en `convex/`; los de `auth.test.ts` cubren precisamente las comprobaciones de
  propiedad que vas a reescribir, así que si rompes el aislamiento entre usuarios
  te enterarás.
- **Antes de cualquier cambio de schema, `npx convex dev --once`.** Quitar un
  campo rompe producción mientras queden documentos que lo traigan.
- **`convex/exportData.ts` tiene que seguir el mismo recorrido de tablas que
  `deleteMyAccount`.** Hay un test que los compara y falla si añades una tabla a
  uno y no al otro. Si creas la tabla de enlace, decide si entra en la exportación
  (probablemente sí: dice con quién compartes) y en el borrado.
- **Las páginas legales se verifican contra el código, no se redactan sueltas.**
  El riesgo no está en lo que falta por escribir, está en lo que el texto afirma y
  el código desmiente. En una auditoría anterior las cuatro discrepancias graves
  eran textos perfectamente plausibles que el código contradecía — por ejemplo, la
  página prometía opt-in mientras el default del backend era `true`. Comprueba
  cada afirmación que toques.
- **Los mensajes de commit van en inglés.** Se trabaja directamente sobre `main`.

## Hecho significa

- Los cuatro comandos de arriba en verde.
- Tests nuevos para: un invitado ve la ficha, un no invitado no; el invitado no
  puede borrarla; desligarse funciona; la propiedad se transfiere al cerrar la
  cuenta del creador; las tandas generadas siguen siendo privadas y las ideas
  guardadas no.
- `docs/dudas.md` actualizado: la entrada pasa a resuelta con lo que se construyó
  de verdad.
- `/privacidad` y `docs/privacy.md` movidos en el mismo commit que el código.
