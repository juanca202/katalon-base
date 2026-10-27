---
name: generate-report
description: Genera reportes de calidad basados en templates DTG con inputs específicos por tipo de reporte
triggers:
  - generate-report
  - crear reporte
  - generar reporte DTG
---

# Generate Report Skill

Genera reportes de calidad basados en templates DTG disponibles en `docs/templates/`, creando archivos en `docs/reports/` con el formato: `{codigo-reporte}-{codigo-requerimiento}-{d-mm-yyyy}.md`

## Capacidades

- Mapea códigos DTG a templates específicos
- Solicita inputs requeridos según el tipo de reporte
- Genera nombres de archivo con formato estándar
- Copia y personaliza templates con placeholders

## Regla global: historias de usuario obligatorias

**Para generar cualquier reporte salvo DTG-063 (018, 019, 020, 022, 045) el usuario DEBE indicar el código de una o varias historias de usuario** (`US-XXX`) que entran al reporte. Sin ese dato no se genera nada.

- Si falta, pedirlo y detenerse: no inferirlo, no asumir «todas» ni listar y elegir por el usuario (se puede mostrar la lista de US disponibles en `docs/specs/changes/user-stories/` como ayuda).
- Validar que cada código exista como carpeta `docs/specs/changes/user-stories/US-XXX-*`; si alguno no existe, avisar y detenerse.
- **Excepción DTG-063:** no recibe US; recibe el **código de requerimiento** y se alimenta de los reportes ya generados en `docs/reports/` (ver "Proceso DTG-063").
- El código de requerimiento (`SRS-XXX`) es aparte: sirve para el nombre del archivo y la cabecera, y se toma del campo `**Requerimiento:**` de las US. Si las US apuntan a requerimientos distintos, preguntar cuál usar.

## Tipos de reportes soportados

### DTG-018 - Matriz de incidencias

**Input requerido:** Códigos US-XXX (obligatorio); los bugs vinculados a esas historias se obtienen de Azure DevOps vía MCP o del contexto local ya descargado (ver "Proceso DTG-018")
**Template:** `docs/templates/DTG018-matriz-de-incidencias.md`
**Descripción:** Matriz de incidencias encontradas durante las pruebas

### DTG-019 - Análisis de pruebas

**Input requerido:** Códigos US-XXX (obligatorio) + SRS, wireframes/diseño y datos del equipo (ver "Proceso DTG-019")
**Template:** `docs/templates/DTG019-analisis-de-pruebas.md`
**Descripción:** Análisis completo de estrategias y alcance de pruebas

### DTG-020 - Matriz de eventos

**Input requerido:** Casos de prueba (TC-XXX) de una o varias historias de usuario y/o de requerimientos (ver "Proceso DTG-020")
**Template:** `docs/templates/DTG020-matriz-de-eventos.md`
**Descripción:** Matriz de casos de prueba y eventos de testing

### DTG-022 - Pantallas de soporte

**Input requerido:** Códigos de las historias de usuario (US-XXX); las evidencias se leen de `allure-results/` (ver "Proceso DTG-022")
**Template:** `docs/templates/DTG022-pantallas-de-soporte.md`
**Descripción:** Documentación de pantallas y evidencias de soporte

### DTG-045 - Informe final de pruebas

**Input requerido:** Códigos US-XXX (obligatorio) + datos del Progress Report de Azure DevOps, obtenidos con el MCP de Azure DevOps (ver "Proceso DTG-045")
**Template:** `docs/templates/DTG045-informe-final-de-pruebas.md`
**Descripción:** Informe final consolidado de todas las pruebas

### DTG-063 - Check-list de calidad

**Input requerido:** Código del requerimiento (obligatorio, en lugar de US); se buscan en `docs/reports/` los DTG que lo incluyen (ver "Proceso DTG-063")
**Template:** `docs/templates/DTG063-check-list-calidad-ejecucion.md`
**Descripción:** Check-list de documentación y calidad de ejecución

## Instrucciones de uso

Cuando el usuario solicite generar un reporte:

1. **Identificar el código DTG** del reporte solicitado
2. **Validar que existe el template** correspondiente
3. **Solicitar los inputs específicos** requeridos para ese tipo de reporte
4. **Solicitar código de requerimiento** si no se proporciona
5. **Generar el archivo** con el formato: `{codigo-reporte}-{codigo-requerimiento}-{d-m-yyyy}.md`
6. **Copiar el template** y personalizarlo con los datos proporcionados

> **Paso 0:** exigir los códigos US-XXX según la "Regla global" (DTG-063 exige el código de requerimiento).

> Para **DTG-020** el paso 3 no le pide los casos al usuario: sigue el "Proceso DTG-020" (lee los TC desde `user-stories/` y/o `requirements/`) y solo pregunta qué US/SRS incluir.

## Flujo de trabajo

```
Usuario solicita: "generar reporte DTG-018"
↓
Skill identifica: template DTG018-matriz-de-incidencias.md
↓
Solicita inputs: "Los bugs están atados a la historia" + código requerimiento
↓
Genera archivo: DTG018-REQ001-30-9-2026.md (ejemplo)
↓
Personaliza placeholders con datos proporcionados
```

## Proceso DTG-019 - Análisis de pruebas

Es el único reporte que mezcla contenido de specs con datos que el repo no tiene. El skill arma lo que puede desde el repo y **pide el resto antes de generar**; nunca inventa riesgos, equipo, fechas ni normativa.

### 1. Fuentes en el repo (se leen solas, a partir de las US indicadas)

| Sección de la plantilla                         | Fuente                                                                                                                                                                                                                                                                       |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cabecera, `Requerimiento #`, Aplicativo, Módulo | `**Requerimiento:**` de la US → `requirements/SRS-XXX-*/README.md` (título, §1.2 alcance, §2.2 funciones); módulo = título de la US                                                                                                                                          |
| Resumen, 1. Introducción                        | SRS §1.1 Propósito y §2.1 Perspectiva; `Descripción` y `Contexto` de cada US                                                                                                                                                                                                 |
| 1.1 Documentos relacionados                     | SRS y US (código, `Última actualización`), SRS §1.4/§15 referencias, `docs/architecture/` si aplica, DTG ya generados en `docs/reports/`                                                                                                                                     |
| 2.1.1 Flujo propuesto                           | Wireframes (`requirements/SRS-*/assets/wireframes/*.svg\|md`, `user-stories/US-*/wireframes/`) y diagramas de `docs/architecture/`. «Flujo actual»: SRS §2.1 / `raw-requirement.md`; si no consta, «No aplica, es una funcionalidad nueva» solo con confirmación del usuario |
| 2.1.2 Pruebas de flujo propuesto                | Pasos de los TC `Happy Path` de las US (`test-cases/`); objetivo = criterios de aceptación                                                                                                                                                                                   |
| 2.1.3–2.1.5 Entidades, marcas, productos        | Normalmente «No aplica» en este proyecto (portal web sin marcas/productos); confirmar, no omitir en silencio                                                                                                                                                                 |
| 2.1.6 Aplicativos impactados                    | SRS §9 Interfaces externas y §3 stack (portal, API REST de BAW)                                                                                                                                                                                                              |
| 2.1.7 Funcionalidad a probar                    | Criterios de aceptación (AC-XXX) de las US; SRS §6 FR, §7 NFR, §8 reglas de negocio; parametrizaciones: SRS §2.5 y §10                                                                                                                                                       |
| 2.1.8 Colaterales / 2.1.9 Fuera de alcance      | SRS §1.2 «Fuera de alcance», §2.6 requisitos diferidos; US `Observaciones` y hallazgos de `test-cases-automation.md`                                                                                                                                                         |
| 2.1.10 Normativa                                | SRS §11 Cumplimiento normativo                                                                                                                                                                                                                                               |
| 2.2.1 Historias de usuario de calidad           | Tabla US: ID, descripción, AC-XXX y tipo de prueba (E2E / API / Visual) tomado del índice de `test-cases/`                                                                                                                                                                   |
| 2.2.2–2.2.3 Casos de uso / prediseñados         | Índice de `test-cases/README.md` de cada US                                                                                                                                                                                                                                  |
| 2.2.5–2.2.6 Prerrequisitos y datos              | Precondiciones y `Datos de prueba` de los TC (marcados `[propuesto]`), `.env.example`, ambiente de referencia del TC; `docs/adr/ADR-007` para la estrategia de datos                                                                                                         |
| 2.3 Riesgos                                     | SRS §14 Riesgos (copiar con su probabilidad/impacto/mitigación)                                                                                                                                                                                                              |
| 2.4 Documentación                               | Lista fija: DTG018, DTG020, DTG022, DTG045 (y DTG063)                                                                                                                                                                                                                        |
| 2.5 Equipo de trabajo                           | SRS §5 Equipo (si existe)                                                                                                                                                                                                                                                    |
| 3. Glosario                                     | `docs/glossary.md` y SRS §1.3, solo los términos usados en el documento                                                                                                                                                                                                      |

### 2. Lo que el usuario debe aportar (preguntar si falta)

1. **Códigos US-XXX** (obligatorio, Regla global).
2. **Responsable(s), área y aprobador** de la cabecera, tabla de versiones y sección 4 Aprobación.
3. **Fechas de caducidad y de cumplimiento** del requerimiento (la plantilla las pide; no existen en el repo).
4. **Diseño de referencia:** el skill usa los wireframes del repo; si el usuario tiene un Figma u otro enlace, debe darlo y se cita en 1.1 y 2.1.1 (no se puede leer el contenido de un Figma privado: se enlaza, no se resume).
5. **DTG-003 y documentos relacionados externos** (hoy no existen en el repo): código, versión y fecha, o confirmar que no aplican.
6. **Coordinación con externos** (§2.2.4), p. ej. equipo de infraestructura de BAW para CORS/cookie `SameSite` (riesgo registrado en US-001): nombres y acuerdos.
7. **Alcance de versiones:** si el requerimiento tiene varias versiones, qué cambió en cada una.

### 3. Reglas de generación

- Todo dato que provenga de un spec debe poder rastrearse: citar la fuente (US/SRS/TC) entre paréntesis o en la columna de documentos.
- Lo que no esté en el repo ni lo haya dado el usuario queda como `{{placeholder}}` y se lista al final; no completar con supuestos.
- Las plantillas `Android/iOS` de 2.2.1 se sustituyen por `Web · E2E / API / Visual`.
- Mantener el índice «Contenido» y la numeración de la plantilla; eliminar subsecciones solo si el usuario confirma que no aplican (dejar «No aplica» con motivo).
- Resumen final: secciones completadas desde el repo, secciones con placeholders y preguntas pendientes.

## Proceso DTG-063 - Check-list de calidad

El check-list no se llena a mano: se deduce de los reportes que **ya existen** en `docs/reports/` para el requerimiento indicado.

### 1. Entrada

- **Código del requerimiento** (p. ej. `SRS-001`), obligatorio. Si falta, pedirlo y detenerse. No se piden US.
- Validar el formato y, si existe, que haya `docs/specs/changes/requirements/{codigo}-*`; si no, avisar pero continuar (puede ser un código externo).

### 2. Buscar los reportes

1. Listar `docs/reports/*.md` (no entrar en `docs/reports/evidencias/`). Un reporte pertenece al requerimiento si:
   - su nombre sigue `DTGxxx-{codigo-requerimiento}-{d-m-yyyy}.md` con ese código, **o**
   - su cabecera `**Requerimiento #:**` contiene ese código.
2. Clasificar por código DTG (018, 019, 020, 022, 045 y los demás que aparezcan) y, si hay varios del mismo DTG, usar el de fecha más reciente y mencionar los anteriores en Observaciones.
3. Leer cada reporte encontrado como contexto. No se regeneran ni modifican.
4. Si no se encuentra ninguno, avisar y ofrecer generar primero los DTG pendientes; no inventar el check-list.

### 3. Completar la tabla de entregables

| Fila                                           | Check (S/N)                                                                                                                                                                                          | Observaciones                                                                                                           |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| DTG018                                         | `S` si existe el reporte                                                                                                                                                                             | Fecha del reporte, cantidad de incidencias y desglose por severidad leído de la matriz; «Sin incidencias» si así consta |
| DTG020                                         | `S` si existe                                                                                                                                                                                        | Fecha y cantidad de casos de prueba/suites; enlace al plan de pruebas si el reporte lo trae                             |
| DTG022                                         | `S` si existe                                                                                                                                                                                        | Fecha y cantidad de TCs con/sin evidencia; enlace al plan de pruebas si consta                                          |
| DTG045                                         | `S` si existe                                                                                                                                                                                        | Fecha, ejecutados/exitosos/fallidos y URL del progress report                                                           |
| DTG019                                         | Solo si la plantilla lo incluye; la plantilla base no lo lista, no agregar filas sin confirmar                                                                                                       | —                                                                                                                       |
| DTG021, DTG032, DTG047, DTG026, DTG027, DTG033 | **No se generan con este skill**: `S` solo si hay un archivo para ese requerimiento en `docs/reports/`; si no, preguntar al usuario `S` / `N` / «No aplica, motivo». Nunca marcar `S` por suposición | Lo que indique el usuario                                                                                               |

- Si el reporte no existe, marcar `N` y escribir en Observaciones «Pendiente: generar con generate-report {DTG}».
- Un reporte con placeholders `{{…}}` sin resolver cuenta como `S` con observación «Con datos pendientes: …» (listar cuáles).
- Un reporte con advertencias (p. ej. DTG-018 sin MCP o desactualizado, DTG-045 con datos no disponibles) lo refleja en Observaciones.

### 4. Cabecera y verificación

- Cabecera como en DTG-020: `DTG063`, `Check-list de calidad`, requerimiento, aplicativo/funcionalidad (tomados de los reportes encontrados o del SRS), fecha actual. Responsable y aprobador: de los reportes si coinciden; si no, preguntar o dejar placeholder.
- Verificar coherencia entre reportes y anotar discrepancias (p. ej. cantidad de incidencias de DTG-018 ≠ DTG-045, TCs de DTG-020 ≠ DTG-045).
- Resumen final: entregables en `S`/`N`, los que requieren respuesta del usuario y las discrepancias.

## Proceso DTG-018 - Matriz de incidencias

Los bugs están atados a las historias de usuario. La fuente es **Azure DevOps vía MCP**; si ya fueron descargados antes, se reutiliza esa copia local como contexto.

### 1. Prerrequisitos

- **US-XXX obligatorias** (Regla global).
- Id del work item de Azure de cada US (README de la US o `.sdd-devkit/settings.json`; si no consta, preguntar), más organización y proyecto.
- Herramientas del MCP de Azure DevOps (work items, relaciones, queries): descubrirlas en la sesión sin asumir nombres.

### 2. Obtener los bugs (local primero, Azure después)

Copia local: `docs/specs/changes/user-stories/US-XXX-*/bugs/BUG-{id}.md` (un archivo por bug, ver formato abajo).

1. Por cada US, listar los bugs ya descargados en su carpeta `bugs/`.
2. Si hay MCP disponible, consultar en Azure los bugs relacionados a la US: relaciones del work item de la US (Related/Child/Parent), bugs vinculados a sus Test Cases y resultados de prueba fallidos, y la query que defina el usuario.
3. Para cada bug de Azure:
   - **No existe localmente** → descargarlo y guardarlo en `bugs/BUG-{id}.md`.
   - **Existe localmente** → comparar `Estado` y fecha de último cambio; si Azure cambió, actualizar el archivo y avisar (no sobrescribir en silencio notas manuales: conservar la sección `Notas locales`).
4. Un bug vinculado a varias US se guarda en la de menor código y se referencia desde las demás (`Ver también`); en la matriz aparece una sola vez.
5. **Sin MCP:** usar solo los bugs ya descargados y declarar en el resumen que la matriz puede estar desactualizada (con la fecha de última descarga). Si tampoco hay copia local, detenerse y avisar; no inventar incidencias. Si no hay bugs reales (Azure confirma cero), generar la matriz con una fila «Sin incidencias» y la fecha de consulta.

**Formato de `BUG-{id}.md`:**

```
# BUG-{id} — {título}
<!-- bug:id={id} · state={estado} · severity={sev} · parent={US-XXX} · synced={yyyy-mm-dd hh:mm} -->
**URL:** {enlace al work item}
**Historias:** US-XXX[, US-YYY]
**Test cases relacionados:** TC-XXX (si constan)
**Campos:** Prioridad · Severidad · Categoría · Estado · Asignado calidad · Responsable de construcción · Fecha de creación · Fecha de resolución · Fecha de certificación · Responsable de certificación · Área · Etiquetas
## Descripción / pasos para reproducir
{texto de Azure, sin modificar}
## Notas locales
{texto manual, se conserva entre sincronizaciones}
```

No guardar credenciales, tokens ni cabeceras sensibles que vengan en el texto del bug; enmascararlos y avisar.

### 3. Mapeo a la plantilla

| Columna de `Detalle`                                  | Campo de Azure                                                                                                         |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| ID                                                    | Id del work item                                                                                                       |
| Resumen                                               | Title                                                                                                                  |
| Asignado calidad                                      | Campo de analista de calidad / Created By si no hay otro                                                               |
| Fecha de creación                                     | Created Date                                                                                                           |
| Prioridad                                             | Priority (1–4)                                                                                                         |
| Severidad                                             | Severity (`1 - Critical` … `4 - Low`)                                                                                  |
| Categoría                                             | Categoría/tag: `Incidencia UX` o `Incidencia Funcional`; si no consta, inferir de etiquetas y confirmar con el usuario |
| Estado                                                | State (`New / Active / Resolved / Closed`)                                                                             |
| Responsable de construcción                           | Assigned To (desarrollador)                                                                                            |
| Fecha de resolución                                   | Resolved Date                                                                                                          |
| Fecha de certificación / Responsable de certificación | Closed Date / quien cerró; vacío si no está cerrado                                                                    |
| Área responsable                                      | Area Path                                                                                                              |
| Etiquetas                                             | Tags                                                                                                                   |

Cabecera: `URL de la consulta` = la query de Azure usada (o enlace construido solo si el MCP o el usuario lo da); `Estatus` = `Incidencia / Nueva funcionalidad / Definición` según el tipo, preguntar si hay mezcla. Resto de cabecera como en DTG-020. Un campo no disponible queda vacío con `—`, nunca inventado.

### 4. Verificación

- Cada bug de la matriz tiene su `BUG-{id}.md` local y aparece una sola vez.
- Los conteos por severidad/estado coinciden con los que usará DTG-045 (mismo origen).
- Resumen: bugs por US, nuevos descargados, actualizados, fecha/hora de consulta y datos pendientes.

## Proceso DTG-045 - Informe final de pruebas

La fuente de las métricas es el **Progress Report de Azure Test Plans**, consultado con el **MCP de Azure DevOps**. No se calculan a partir de `allure-results/` ni de los `.md` locales: el informe final refleja lo que consta en Azure.

El Progress Report muestra: Tests Passed / Failed / Blocked / Not Run, Run %, Passed %, Failed %, progreso por Test Plan y por Test Suite, tendencia histórica de resultados, y estimaciones y tasa de ejecución.

### 1. Prerrequisitos

- **US-XXX obligatorias** (Regla global).
- **MCP de Azure DevOps disponible.** Descubrir sus herramientas en la sesión (no asumir nombres): buscar las de Test Plans / suites / test points / test runs / work items. Si no hay MCP de Azure DevOps conectado o no está autenticado, avisar al usuario cómo habilitarlo y **detenerse**; no estimar ni rellenar métricas desde otra fuente.
- **Identificación en Azure** (preguntar si falta; no hay forma de deducirlos del repo): organización, proyecto, **Test Plan** (id o nombre) y, por cada US-XXX, el id de su work item y/o su **Test Suite** en Azure. Si la US local tiene el id de Azure en su README o en `.sdd-devkit/settings.json`, usarlo.

### 2. Datos a consultar por cada US/Test Suite indicada

| Dato                             | Consulta en Azure                                                                                                                                                                                                      |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Casos planificados               | Test points del suite (todos)                                                                                                                                                                                          |
| Ejecutados / no ejecutados       | Test points con resultado ≠ `Not Run` / `Not Run` (incluye `Blocked` como no concluyente, informarlo aparte)                                                                                                           |
| Exitosos / fallidos / bloqueados | Outcome del último resultado de cada test point (`Passed`, `Failed`, `Blocked`)                                                                                                                                        |
| Run % / Passed % / Failed %      | Calcular sobre los conteos anteriores (Run % = ejecutados / planificados; Passed % y Failed % sobre ejecutados) y contrastar con lo que muestra el Progress Report si el MCP lo expone                                 |
| Nro. de iteraciones              | Cantidad de test runs distintos que ejecutaron los puntos del suite                                                                                                                                                    |
| Tendencia histórica              | Resultados por run/fecha (si el MCP lo permite); usarla para fecha de inicio y de fin de pruebas                                                                                                                       |
| Incidencias                      | Mismos bugs que DTG-018: reutilizar las copias `bugs/BUG-{id}.md` (sincronizarlas según el "Proceso DTG-018") y contar por severidad (Crítico/Alto/Medio/Bajo) y estado (solucionado, cerrado sin solución, pendiente) |
| URL del progress report          | Enlace al Progress Report del Test Plan en Azure (construirlo con organización/proyecto/plan solo si el MCP o el usuario lo proporciona; no inventar)                                                                  |

Si el MCP no expone un dato (p. ej. el gráfico de tendencia o las estimaciones), dejarlo como `{{placeholder}}` con la nota «no disponible vía MCP», no estimarlo.

### 3. Mapeo a la plantilla

- **Datos generales:** Descripción y Nro. requerimiento desde las US/SRS (como DTG-019/020); fecha de inicio/fin de pruebas desde la tendencia de runs; analistas desde el campo «Assigned To» de los test points; gestor de calidad, fechas de paso a calidad, notificación a GSF, fin de documentación y cronograma de paso a GSF **no existen en Azure ni en el repo**: pedirlas al usuario.
- **Pruebas funcionales:** una tabla con los totales de las US indicadas; si son varias US, añadir una tabla por suite y un total consolidado.
- **Resumen de incidencias:** matriz severidad × estado a partir de los Bugs; la fila «Soportes» refleja los bugs/soportes con evidencia, o `0` solo si Azure confirma que no hay.
- **Observaciones y recomendaciones:** casos no ejecutados con su motivo (según Azure: bloqueados, no aplican), hallazgos abiertos y recomendación de paso o no a GSF; cualquier juicio debe respaldarse en las cifras, no suavizarlas.
- **URL del progress report:** el enlace de Azure.

### 4. Coherencia con el repo (advertencia, no sustitución)

Cruzar los TCs `Ready` de las US (`test-cases/README.md`) con los test points de Azure. Si hay TCs locales que no existen en Azure (o al revés), o las cifras de `allure-results/` contradicen Azure, **informarlo en Observaciones**, sin corregir los números de Azure.

### 5. Verificación previa a guardar

- Ejecutados + no ejecutados = planificados; exitosos + fallidos (+ bloqueados) = ejecutados.
- Los porcentajes son reproducibles desde los conteos.
- Se informa la fecha/hora de la consulta a Azure (los datos cambian).
- Lista final de placeholders y datos que el usuario debe aportar.

## Proceso DTG-020 - Matriz de eventos

Los casos de prueba no se piden al usuario: se leen de la documentación de specs, pero solo de las historias cuyo código indicó el usuario (ver "Regla global"). Un reporte DTG-020 puede cubrir **una o varias** historias de usuario.

### 1. Fuentes de los casos de prueba

| Origen                                                                   | Ubicación                                                                                                                  | Identificador |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- | ------------- |
| Historia de usuario                                                      | `docs/specs/changes/user-stories/US-XXX-{slug}/test-cases/TC-*.md`                                                         | `US-XXX`      |
| Requerimiento (solo si el usuario indica también el SRS de las US dadas) | `docs/specs/changes/requirements/SRS-XXX-{slug}/` (buscar `test-cases/TC-*.md` y cualquier `TC-*.md` dentro de la carpeta) | `SRS-XXX`     |

- El `README.md` de cada carpeta `test-cases/` es el índice (TC, perspectiva, tipo, estado, prioridad, criterio); los `TC-*.md` tienen el detalle.
- Los TCs propios de un SRS (si los tiene) se incluyen como suite aparte solo cuando el usuario, además de las US, pide incluir ese requerimiento. El SRS nunca reemplaza a los códigos de US.
- Si una carpeta indicada no existe o no tiene TCs, avisar y no inventar casos.

### 2. Determinar el alcance

1. Usar exactamente las US indicadas por el usuario (obligatorio); si no hay, detenerse y pedirlas.
2. Si alguna US no tiene `test-cases/`, avisar y no incluirla.
3. Preguntar con qué estados incluir los TC (por defecto: todos menos `Deprecated`/`Obsoleto`).

### 3. Mapeo TC → plantilla

Cada historia (o SRS con TCs propios) genera un bloque `### Suite {id} — {título}`. Por cada TC del origen:

| Campo de la plantilla         | Se toma de                                                                                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `{{id-HU}}` / título de suite | `US-XXX` / `SRS-XXX` y el `# título` de su `README.md`                                                                                                        |
| `{{id-TC}}`                   | Encabezado `# TC-XXX` del archivo                                                                                                                             |
| `{{título del caso}}`         | Resto del encabezado `# TC-XXX — {título}`                                                                                                                    |
| `{{ruta-de-área}}`            | Nombre del aplicativo / US (p. ej. `Portal BAW\US-001`)                                                                                                       |
| `{{analista}}`                | `**Creado por:**`                                                                                                                                             |
| `{{Design / Ready / Closed}}` | `**Estado:**` del TC                                                                                                                                          |
| Tabla `Pasos del caso`        | Tabla `## Pasos de ejecución`: `#` → Paso, `Acción` → Acción (anteponer el actor si aporta: «Usuario: …»), `Resultado esperado del paso` → Resultado esperado |

Reglas:

- Copiar los pasos tal cual; no reformular ni agregar pasos.
- Repetir el par «tabla de TC + Pasos del caso» para cada TC; ordenar por ID de TC dentro de la suite.
- Incluir perspectiva, tipo de prueba, prioridad y criterio de aceptación en una columna/nota adicional **solo si** el usuario lo pide; la plantilla base no las trae.
- La plantilla habla de hojas `UX/FUNC Android/iOS` (app móvil): este proyecto es web. Sustituir esa línea por el tipo de prueba del TC (`E2E`, `API Test`, `Visual Test`) o, si se quiere, por browser/viewport; no dejar Android/iOS.
- Si un TC tiene varios tipos (p. ej. `API Test, E2E`), mantenerlo en una sola suite indicando ambos tipos.

### 4. Cabecera del documento

- `{{DTGXXX}}` → `DTG020`; `{{Nombre del documento}}` → `Matriz de eventos`.
- `{{nro-requerimiento}}` → código del requerimiento (p. ej. `SRS-001`); si el alcance son solo US, tomarlo del campo `**Requerimiento:**` de ellas.
- `{{aplicativo}} - {{funcionalidad}}` → nombre del SRS (p. ej. `Portal de administración de procesos IBM BAW`) y las historias cubiertas.
- `{{dd/mm/aaaa}}` → fecha actual. `Responsable`, `Área` y la tabla de versiones: preguntar o dejar el placeholder para completar manualmente (no inventar aprobador).
- Eliminar el bloque de comentario inicial y la línea de «Un bloque por historia…» / «Categorías de casos habituales» al publicar.

### 5. Verificación previa a guardar

- El número de TC del reporte coincide con la suma de TCs de los índices fuente; informar el conteo por suite.
- Ningún TC repetido (un mismo TC no se lista en dos suites).
- No quedan `{{…}}` salvo los que requieren datos manuales del usuario (responsable, aprobador), y se listan en el resumen final.

## Proceso DTG-022 - Pantallas de soporte

Documenta, por historia de usuario, la evidencia de ejecución de sus casos. La evidencia sale de **`allure-results/`** (resultados de Allure de la última ejecución); no se le pide al usuario ni se toma de capturas sueltas.

### 1. Entrada y alcance

- Obligatorio: códigos `US-XXX` (Regla global). Los TCs de cada US se listan desde `docs/specs/changes/user-stories/US-XXX-*/test-cases/README.md`.
- Verificar que `allure-results/` exista y tenga archivos `*-result.json`. Si no, avisar que hay que ejecutar la Test Suite en Katalon Studio y luego `npm run allure:katalon`, y detenerse; no fabricar evidencia.
- Informar la fecha/hora de la corrida (`start` del primer resultado y `stop` del último, en milisegundos epoch) y avisar si es anterior a los últimos cambios de las pruebas.
- `npm run allure:katalon` limpia `allure-results/` al iniciar, así que contiene solo la última ejecución convertida.

### 2. Extraer la evidencia de `allure-results/`

Cada prueba es un `{uuid}-result.json`. Leerlos con un script temporal (en el scratchpad, no en el repo):

1. Campos de cada resultado: `name` (empieza por `TC-XXX - `), `status` (`passed`, `failed`, `broken`, `skipped`), `start` y `stop`, `statusDetails.message` y `statusDetails.trace` ante un fallo, `historyId`, `labels` y `steps`.
2. Etiquetas (`labels[]`): `parentSuite` = tipo (`E2E` o `API`), `platform` = plataforma (solo E2E: `Web desktop`, `Web mobile`, `Mobile`), `feature` = historia (`US-XXX: título`), `story` = criterio (`AC-XXX: título`), y `suite` = Test Suite de Katalon ejecutada.
3. Los adjuntos viven en la misma carpeta, referenciados por `source` (`{uuid}-attachment.{ext}`) en `attachments[]` y, sobre todo, dentro de `steps[].attachments[]` en cualquier nivel de anidación: recorrer los pasos recursivamente. Tipos: capturas (png/jpg), videos (avi/mov/mp4) y el log de la ejecución (`execution0.log`), que `scripts/katalon/junit-to-allure.mjs` copia a `allure-results/` desde el reporte de Katalon (ADR-003).
4. Asociar cada prueba a su US y TC por la etiqueta `feature` (id `US-XXX`) y el prefijo `TC-XXX - ` del nombre. Descartar pruebas de US no solicitadas.

Una misma prueba puede aparecer varias veces: agrupar por `historyId`, usar el resultado con `stop` más reciente y anotar las repeticiones. Un mismo TC ejecutado en plataformas distintas son dos filas, una por plataforma.

### 3. Copiar la evidencia al entregable

El reporte `.md` debe seguir legible aunque `allure-results/` se limpie (se vacía al iniciar cada ejecución). Por eso:

- Copiar los adjuntos usados a `docs/reports/evidencias/{codigo-reporte}-{codigo-requerimiento}-{d-m-yyyy}/US-XXX/TC-XXX/` con nombre legible (`{plataforma}-screenshot.png`, `{plataforma}-video.webm`, `{plataforma}-request.json`…) y enlazarlos con rutas relativas desde el reporte.
- No editar ni reescribir el contenido de los adjuntos. Las cabeceras sensibles de las pruebas API ya vienen enmascaradas por el framework; si aparece un token o `Authorization` sin enmascarar, no copiarlo y avisar.
- Si una prueba no tiene adjuntos (p. ej. `skipped`), registrarla igual con «Sin evidencia: {estado}» y no inventar pantallas.

### 4. Mapeo a la plantilla

La plantilla es un índice `Plataforma / tipo | Historia de usuario | Enlace a la suite de pruebas`, y su fila original usa `UX/Funcional × Android/iOS` (app móvil). Este proyecto es web:

| Campo                        | Valor                                                                                                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Plataforma / tipo            | `{platform} · {tipo}` (p. ej. `Web desktop · E2E`, `Web mobile · E2E`, `Mobile · E2E`, `API`) — una fila por US y combinación plataforma/tipo con resultados |
| Historia de usuario          | `US-XXX: {título del README de la US}`                                                                                                                       |
| Enlace a la suite de pruebas | Enlace relativo a la sección de la US en el mismo documento, o a `docs/specs/changes/user-stories/US-XXX-*/test-cases/README.md`                             |

Después del índice, añadir por cada US una sección `## US-XXX — {título}` y por cada TC:

- Encabezado `### TC-XXX — {título}` y tabla `Plataforma | Resultado | Duración | Evidencia` (una fila por plataforma ejecutada; resultado = `passed / failed / broken / skipped` según `status`; duración = `stop - start`).
- Las capturas como imágenes (`![TC-XXX screenshot]({ruta})`) y los videos, traces, request/response y `error-context` como enlaces.
- Ante un fallo, incluir el mensaje de error del resultado y enlazar el trace.

### 5. Cabecera y verificación

- Cabecera igual que DTG-020 (sección 4 de ese proceso): `DTG022`, `Pantallas de soporte`, requerimiento, aplicativo, fecha actual; responsable/aprobador quedan como placeholder.
- Verificar: cada TC `Ready` de las US indicadas aparece en el reporte, con evidencia o con la nota «Sin evidencia»; todos los enlaces relativos apuntan a archivos copiados que existen.
- Resumen final: TCs con evidencia / sin evidencia por US, y placeholders pendientes.

## Validaciones

- Verificar que el código DTG sea válido (018, 019, 020, 022, 045, 063)
- Confirmar que existe el template correspondiente
- Validar formato de código de requerimiento
- Asegurar que no exista ya un archivo con el mismo nombre
- Verificar (excepto DTG-063, que exige el código de requerimiento) que el usuario indicó al menos un código US-XXX y que cada uno existe en `docs/specs/changes/user-stories/`

## Formato de fecha

Usar formato día-mes-año: `d-m-yyyy`
Ejemplo: 30-9-2026 para el 30 de septiembre de 2026

## Personalización de templates

- Reemplazar `{{DTGXXX}}` con el código DTG específico
- Actualizar `{{nro-requerimiento}}` con el código de requerimiento
- Establecer `{{dd/mm/aaaa}}` con la fecha actual
- Mantener otros placeholders para que el usuario los complete manualmente

Siempre exigir los códigos US-XXX y preguntar por los demás inputs específicos requeridos antes de generar el reporte, y confirmar el código de requerimiento para asegurar el nombre correcto del archivo.
