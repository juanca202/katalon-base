# TC-34294 — Dado el modal de autenticación abierto desde el modo demo, Cuando el usuario elige no registrarse ni iniciar sesión, Entonces puede volver a la demo sin completar el registro o el login

<!-- tc:status=Ready · testType=E2E · criterion=AC-009 · parent=US-34266 -->

**Estado:** Ready
**Tipo de prueba:** E2E
**Tipo de ejecución:** 🤖 Fully Automated
**Plataformas:** Web, Web móvil, App
**Fecha:** 2026-10-26
**Perspectiva:** Happy Path
**Prioridad:** Media
**Criterio de aceptación:** AC-009 (Usabilidad) — El modal permite volver a la demo sin obligar al registro/login
**Artefacto padre:** US-34266
**Creado por:** juanca202
**Work Item (ADO):** [#34294](https://dev.azure.com/BayteqDev/Bayteq%20IA/_workitems/edit/34294)

## Precondiciones

- Entorno de referencia: **Producción**.
- El usuario está en modo demo y dispara una acción que abre el modal de autenticación.

## Datos de prueba

| Campo              | Valor                        | Notas                           |
| ------------------ | ---------------------------- | ------------------------------- |
| Acción disparadora | intento de crear o modificar | Abre el modal de login/registro |

## Pasos de ejecución

| #   | Actor   | Acción                                                                               | Resultado esperado del paso                                                         |
| --- | ------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| 1   | usuario | Dispara una acción que abre el modal de autenticación (intento de crear o modificar) | Se muestra el modal con opciones de iniciar sesión y registrarse                    |
| 2   | usuario | Elige la opción de volver a la demo (cerrar / descartar el modal)                    | El modal se cierra sin obligar a registrarse ni iniciar sesión                      |
| 3   | usuario | Observa el estado de la aplicación                                                   | El usuario permanece en el modo demo, en la misma vista desde la que abrió el modal |

## Resultado esperado final

El usuario cierra el modal de autenticación y regresa al modo demo sin haberse registrado ni iniciado sesión, conservando su contexto de navegación.

## Observaciones

- Verificación de **flujo**, no visual.
- Continúa el escenario de [TC-34289](./TC-34289-modal-crear-modificar-happy.md).
