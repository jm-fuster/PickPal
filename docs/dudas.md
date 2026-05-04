# Dudas y decisiones pendientes

Lista de preguntas abiertas que hay que resolver antes o durante el desarrollo.

---

## Producto

- [ ] **¿El usuario puede configurar cuántos días antes quiere recibir aviso?**
  Actualmente el plan contempla un campo `notifyDaysBefore` en settings. ¿Es por usuario global o por persona o por fecha? La tabla `userSettings` ya existe en Convex; falta UI en `/settings` para editarlo.

- [ ] **¿Se guardan las recomendaciones generadas o se regeneran cada vez?**
  Ahora mismo se generan en cada visita a `/gifts`. Con el rate limit de 10/día/usuario el riesgo es bajo, pero guardarlas en Convex permitiría volver a verlas sin gastar cuota.

- [ ] **¿Notificaciones por email/push además del badge en la app?**
  Clerk soporta envío de emails. ¿Se quiere enviar un recordatorio por email X días antes?

- [ ] **¿Presupuesto por persona o por fecha/ocasión?**
  Actualmente el presupuesto es por persona. Para un cumpleaños puedes gastar más que para un aniversario cualquiera.

- [ ] **¿Múltiples usuarios pueden compartir perfiles?** (ej: perfil de los padres compartido con hermanos)
  No está contemplado en el diseño actual — cada persona pertenece a un único usuario.

---

## Técnicas

- [ ] **¿Internacionalización (i18n)?**
  La app está pensada para España (amazon.es, euros). ¿Se quiere soportar otros idiomas o mercados desde el inicio?

- [ ] **¿Testing automatizado?**
  Cero tests de momento. Vitest para utilidades y esquemas Zod, `convex-test` para mutaciones críticas — buen siguiente paso.

---

## Resueltas

- [x] **Nombre de la app:** PickPal. Repo: `JMFusterr/PickPal`. Proyectos en Clerk y Convex también `pickpal`. _Renombrado desde "Giftly" el 2026-05-04 por colisión con apps existentes._
- [x] **Modo oscuro.** Implementado con `next-themes` + shadcn/ui (`ThemeProvider`, `ThemeToggle`).
- [x] **Landing page pública.** Explica el producto con tres tarjetas de features y CTA dual (registro / login).
- [x] **Rate limiting en `/api/recommendations`.** 10 generaciones por usuario y día (UTC), tabla `recommendationUsage` en Convex.
- [x] **Manejo del 29 de febrero.** En años no bisiestos cae al 28 de febrero (fix en `src/lib/dates.ts`).
- [x] **Hosting / despliegue.** Vercel auto-deploy desde `main` + Convex dev. Dominio: `pickpal.vercel.app` (anterior: `giftly-blond.vercel.app`).
