# Plan de Proyecciones y Optimización de Tandas (2027–2031)

Desde el ciclo 2027 y hasta el final del proyecto (2031), la Regla 9 fija un **máximo de 450 palabras/frases** por tanda regular y de **550** para la de Fin de Año. Como la comprensión sigue subiendo, cada palabra cuesta más minutos de contenido, y las tandas se alargan aunque la cuota baje.

Este plan busca:
1. **Proyectar** cuánto van a durar las tandas y cuántas líneas se leen, con un modelo que se recalibra con cada vocabulario nuevo.
2. **Repartir** los contenidos entre las tandas para acercar cada una a la cuota sin pasar de 8 h, respetando las reglas del proyecto.
3. **Revisar** si el contenido pensado para 2028–2031 entra en cada año.

Fuentes: `información para proyección 2027.txt` (la planificación) y `fanning-dashboard/data/timeline.json` (las cifras oficiales).

---

## Herramienta

```
python scripts/metricas/proyeccion.py              # proyección + propuesta de reacomodo de 2027
python scripts/metricas/proyeccion.py --sin-plan   # solo la proyección
python scripts/metricas/proyeccion.py --rehacer-tmdb
```

Deja todo en `scripts/metricas/reporte_proyeccion.md`. Datos que usa (en `scripts/metricas/datos_proyeccion/`):

| Archivo | Qué tiene | ¿Se edita a mano? |
|---|---|---|
| `ajustes.json` | Correcciones al txt: duraciones de lo que no está en TMDB, cifras reales, episodios dobles (Kick Buttowski), partes de GTA SA, títulos fijos, sagas con orden, temáticas, ids de TMDB | **Sí** |
| `realeza.json` | Reinas y reyes con su id de TMDB y cumpleaños (traídos de TMDB) | Sí, para corregir |
| `tmdb.json` | Duración, elenco y temática de cada título | No: se genera |

El reparto lo hace `scripts/metricas/planificador.py`: prueba miles de cambios chicos y se queda con el mejor según las prioridades de abajo.

---

## Reglas y decisiones (16/10/2026)

**Cuota y duración**
- **Techo de 450** (Fin de Año: 550, sumando sus partes). Se acepta pasarse hasta 5 palabras si sobran. No hay mínimo. Fija hasta 2031.
- **Duración máxima: 8 h por tanda** (salvo excepciones). Las pausas no cuentan. **Cada 6 h acumuladas se suma un día de aplicación** (Regla 11; eran 5 h hasta la 68° Tanda).
- **Fechas fijas.** Solo se mueven 1 o 2 días por una emergencia.

**Armado**
- **Una película va entera en una sola tanda; una serie se puede repartir.** El vocabulario de cada título se hace completo antes de la tanda.
- **Orden canónico obligatorio dentro de cada serie.** En las sagas es más flexible (el modelo mantiene Twilight en orden; se quita en `ajustes.json` → `"sagas"`).
- **Todas las series que se empiezan se terminan dentro del proyecto.**
- **Fijos:** Twilight I en la 74°. Oh. What. Fun. y A Taste of Christmas en la tanda de Fin de Año.
- **Temáticas:** Halloween y Navidad llevan al menos una película de la temática (**obligatorio**). La Navidad va en la parte "a" de Fin de Año (24 o 25/12). La tanda más cercana al cumpleaños de una reina o rey lleva algo con esa persona **cuando se pueda (regla flexible)**.
- **Contenido que todavía va a cambiar:** en 2027 lo más probable es que se sume contenido nuevo; lo de 2028 en adelante es tentativo.
- **Realeza:** tiene prioridad para decidir qué contenido entra en cada año.
- **Lo de 2026 para atrás no se toca.** Las tandas de 2027 se pueden reacomodar (como propuesta).

**Estimación**
- Palabras por línea: 1 − comprensión **oficial de la página** del año anterior (2026: 92,81 % → 7,19 %).
- Corrección real ÷ estimado, recalculada en cada corrida: por serie si tiene al menos 3 episodios reales, si no por grupo (películas, series, videojuegos).

**Prioridades del reparto:**
1. No pasarse de la cuota.
2. Cumplir Navidad y Halloween.
3. No pasar de 8 h.
4. Mover lo menos posible y no repartir una serie en episodios sueltos.
5. Cumplir los cumpleaños cuando se pueda.
6. Acercar cada tanda a la cuota. Pesa poco, porque el espacio libre es para el contenido nuevo.

---

## Fase 1: Línea base ✅

| Ciclo | Palabras | Pelis | Episodios | Duración | Líneas | Líneas por palabra | Comprensión |
|---|---|---|---|---|---|---|---|
| 2023 | 273 | 1,2 | 0 | 2,1 h | 2.082 | 7,6 | 86,9 % |
| 2024 | 421 | 2,3 | 1,1 | 4,7 h | 3.930 | 9,4 | 89,3 % |
| 2025 | 459 | 2,4 | 4,5 | 6,5 h | 5.557 | 12,1 | 91,7 % |
| 2026 | 484 | 2,2 | 6,0 | 7,0 h | 6.728 | 13,9 | 92,8 % |

Promedios por tanda. Las series de episodios cortos (Kick Buttowski, TBBT, Kim Possible) son lo que más palabras deja por hora. Las películas son lo más variable.

## Fase 2: Calibrar la estimación ✅ (se recalibra sola)

Comparado con lo que ya tiene vocabulario (con la comprensión oficial de 2026):

| Grupo | Rinde de verdad | Datos |
|---|---|---|
| Películas | **×0,76** (24 % menos de lo estimado) | 17 películas. Una por una, de ×0,39 (The Drama) a ×1,25 (Mary Shelley) |
| Series | ×0,94 | 66 episodios. Por serie: Euphoria ×0,82, Kick ×0,91, TBBT ×0,97, ADC ×0,97… |
| Videojuegos (GTA) | **×2,13** | Solo 2 (Green Sabre, WCTR): muy pocos datos |

La primera versión (×0,88 para películas) estaba mal: mezclaba películas con GTA, que rinde el doble.

## Fase 3: Reparto de 2027 ✅ (primera versión)

**Las tandas como están en el txt** (27 tandas, 74° a 100°): ~10.140 palabras corregidas, ~156.000 líneas y ~161 h.
- **Se pasan de la cuota:** 76°, 81°, 85°, 89° y 91°.
- **Se pasa de 8 h:** la 90° (8:54 h).
- **Quedan muy cortas:** la 88° (~70 palabras), la 95° y la 100a°.
- **Faltan reglas temáticas:** Halloween (la tanda más cercana es la 96°, solo con TBBT) y 12 cumpleaños.
- **Sin tanda:** 10 títulos de 2027 (Euphoria: A Look Back, Love of your Life, The Sun Never Sets, GTA III, GTA Vice City, GTA SA Part III y ADC EP 6–9).

**Propuesta del planificador** (en el reporte, escrita en el formato del txt), con los cumpleaños como regla flexible:
- **Todo lo de 2027 entra:** ~11.120 palabras, ~167.000 líneas y ~182 h.
- **Palabras por tanda:** entre 368 y 443 (Fin de Año: 520).
- **Duración:** ninguna pasa de 8 h.
- **Reglas temáticas:** Navidad (100a°) y Halloween (96°, con Countdown) se cumplen. Quedan sin cumplir 8 cumpleaños, que se pueden resolver a mano.
- **Cambios:** 41 respecto del txt, contando cada episodio por separado. Con los cumpleaños como regla obligatoria eran 98.

**Espacio libre para contenido nuevo:** ~1.130 palabras repartidas en todas las tandas. El reporte muestra, para cada tanda, cuántas palabras y cuánto tiempo le quedan. Las que más espacio tienen son la 84° (82 palabras, pero solo 14 min), la 87°, la 91° (71 palabras y 3:10 h), la 92° y la 97° (50 palabras y 3:18 h).

## Fase 4: Capacidad 2028–2031 ✅ (primera versión)

| Año | Palabras estimadas | Capacidad | Uso | Contenido | Por tanda |
|---|---|---|---|---|---|
| 2028 | ~10.840 | 12.250 | **89 %** | ~177 h | ~6:34 h |
| 2029 | ~18.950 | 12.250 | **155 %** | ~257 h | **~9:31 h** |
| Remanentes | ~1.260 | — | — | ~28 h | — |

- **2029 está sobrecargado.** Pesan ALF (~101 episodios, ~39 h, estimados de TMDB porque el txt no los lista), Girl Meets World, Bizaardvark y The Proud Family. Sobran ~6.700 palabras: unas 15 tandas de 2030.
- **2027 y 2028 tienen espacio** (~1.100 y ~1.400 palabras). Adelantar contenido de 2029 hacia 2028, y de 2028 hacia 2027, emparejaría los años.
- **Es un piso:** está estimado con la comprensión de 2026. En 2028–2029 cada palabra va a costar más líneas, así que el mismo contenido va a dejar menos palabras y va a durar lo mismo.

## Fase 5: Seguimiento durante 2027

- Actualizar el txt cuando se termina un vocabulario (emoji de número) y correr el script.
- Una vez por mes: revisar la corrección por grupo y las tandas que quedan cerca del límite.

## Fase 6: Reparto 2028–2031

- Cuando la lista de 2028 esté ordenada: tandas tentativas (101° a 127°, cada 13–14 días) y reparto con el planificador.
- Decidir qué pasa a 2030 y 2031, empezando por lo que sobra de 2029.

---

## Dudas abiertas

Ver el último mensaje de la conversación del 16/10/2026; las respuestas van al txt.

## Registro de cambios del plan

- **16/10/2026:** se crea el plan; Fase 1.
- **16/10/2026:** primeras decisiones; proyección con el txt y primer reacomodo manual.
- **16/10/2026:** respuestas a las 33 preguntas. Nueva herramienta (lectura por año, TMDB con elenco y cumpleaños, reglas temáticas, planificador automático), corrección por grupo y por serie, y capacidad 2028–2029.
