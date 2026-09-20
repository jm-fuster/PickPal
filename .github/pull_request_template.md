## Qué cambia y por qué

<!-- El porqué es lo que no se ve en el diff. Si hay una issue, enlázala. -->

## Antes de pedir revisión

```bash
npm test                                  # 176 tests
npx tsc --noEmit                          # tipos de la app
npx tsc -p convex/tsconfig.json --noEmit  # Convex tiene su propio tsconfig
npm run lint
```

- [ ] Los cuatro pasan.
- [ ] He probado el cambio en el navegador, no solo en verde.

> CI corre los tres primeros. **No corre el linter ni `next build`**, así que
> esos dos son responsabilidad tuya antes de hacer push.

## Según lo que hayas tocado

- [ ] **`convex/`, `src/app/api/`, `src/proxy.ts` o variables de entorno** — he
      seguido el checklist de [`docs/security.md`](../docs/security.md), que va por
      la ruta que tocas: `requireUser`, comprobación de propiedad, validación de
      args, límites de uso y errores sin filtrar detalle del proveedor.
- [ ] **Algo visual** — he leído [`docs/design-system.md`](../docs/design-system.md)
      y he usado tokens existentes en vez de valores sueltos.
- [ ] **Una variable o un estilo en Figma** — he seguido
      [`docs/figma-tokens.md`](../docs/figma-tokens.md) y **nace con descripción**.
      `npm run token-map` sigue saliendo en verde.
- [ ] **Una ruta nueva** — sé que `src/proxy.ts` deniega por defecto, así que si
      tiene que ser pública va explícitamente en `isPublicRoute`.
- [ ] **El esquema de Convex** — he ejecutado `npx convex dev --once` antes de
      subirlo. Quitar un campo rompe producción si aún hay documentos que lo traen.
- [ ] **Código en `src/lib/`** — lleva tests.

## Documentación

- [ ] Si esto deja obsoleta una afirmación de `docs/` o de los README, va
      corregida **en este mismo commit**. Buena parte de la documentación de este
      repo se desincronizó justo por no hacerlo.

<!--
Los mensajes de commit van en inglés, con prefijo: feat: fix: docs: chore: …
-->
