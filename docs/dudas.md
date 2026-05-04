# Dudas y decisiones pendientes

Lista de preguntas abiertas que hay que resolver antes o durante el desarrollo.

---

## Producto

- [ ] **¿El usuario puede configurar cuántos días antes quiere recibir aviso?**
  Actualmente el plan contempla un campo `notifyDaysBefore` en settings. ¿Es por usuario global o por persona o por fecha?

- [ ] **¿Se guardan las recomendaciones generadas o se regeneran cada vez?**
  Ahora mismo se generan en cada visita a `/gifts`. ¿Interesa guardarlas en Convex para no consumir créditos de API innecesariamente?

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

- [ ] **¿Cómo manejar el 29 de febrero en años no bisiestos?**
  `computeDaysUntilNextOccurrence` necesita un fallback explícito (usar 28 de febrero o 1 de marzo).

- [ ] **¿Rate limiting en `/api/recommendations`?**
  Gemini tiene cuotas. ¿Se limita el número de generaciones por usuario/día para evitar abuso?

- [ ] **¿Testing automatizado?**
  ¿Se implementan tests desde el inicio (Vitest + Playwright) o se deja para después del MVP?

---

## Diseño / UX

- [x] **Nombre de la app:** Giftly. Repo: `JMFusterr/Giftly`. Proyectos en Clerk y Convex también nombrados `Giftly`/`giftly`.
- [ ] **¿Modo oscuro?** shadcn/ui lo soporta con Tailwind, pero hay que decidirlo antes de montar el tema.
- [ ] **¿La landing page pública explica el producto o redirige directamente a login?**
