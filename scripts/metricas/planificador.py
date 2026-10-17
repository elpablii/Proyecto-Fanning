"""Reparte películas y episodios entre las tandas de un año, respetando las reglas del proyecto.

Lo usa proyeccion.py. Busca el reparto con recocido simulado (cambios chicos al azar que se
aceptan si mejoran, y a veces aunque empeoren al principio, para no quedarse en un mal reparto).

Reglas duras (nunca se rompen):
  - Una película va entera en una sola tanda; una serie se puede repartir por episodios.
  - El orden canónico dentro de cada serie: un episodio nunca va en una tanda anterior al previo.
  - Lo fijo (por ejemplo, Twilight I en la 74°) no se mueve.

Lo que se busca, de más a menos importante:
  1. No pasarse de la cuota (450 + 5 de tolerancia; Fin de Año 550 + 5, sumando sus partes).
  2. Cumplir las tandas temáticas obligatorias: Navidad y Halloween.
  3. No pasarse de 8 h por tanda.
  4. Cambiar lo menos posible lo planificado, y no repartir una serie en episodios sueltos.
  5. Cumplir los cumpleaños de la Realeza cuando se pueda (regla flexible).
  6. Acercar cada tanda a la cuota (con poco peso: el año todavía va a sumar contenido).
"""
import math
import random

P_PALABRA_DE_MAS = 100_000   # por palabra sobre la cuota (con tolerancia)
P_SIN_TANDA = 100_000        # por título del año que queda sin tanda
P_TEMA = 50_000              # por regla temática obligatoria sin cumplir (Navidad, Halloween)
P_CUMPLE = 2_000             # por cumpleaños de la Realeza sin cumplir (regla flexible)
P_MINUTO_DE_MAS = 200        # por minuto sobre el máximo
P_MOVER_PELICULA = 6000      # por película que cambia de tanda
P_MOVER_EPISODIO = 600       # por episodio que cambia de tanda
P_SERIE_EN_TANDA = 150       # por cada serie distinta en una tanda (evita repartirla en episodios sueltos)


class Planificador:
    """
    tandas: lista ordenada por fecha de {'id', 'grupo', 'cuota', 'meta', 'max_min', 'requisitos'}
        - grupo: las partes de una misma tanda (100a, 100b) comparten la cuota de palabras.
        - requisitos: lista de (etiqueta, conjunto de marcas, obligatorio); se cumple si algún ítem
          de la tanda tiene alguna de esas marcas ('navidad', 'halloween', 'realeza:<nombre>').
    items: lista de {'clave', 'palabras', 'minutos', 'marcas', 'serie': (nombre, orden) | None,
                     'inicial': id de tanda | None, 'fijo': bool, 'pelicula': bool}
        - serie: cadena con orden obligatorio (episodios de una serie, o películas de una saga).
        - marcas que empiezan con 'serie:' cuentan para P_SERIE_EN_TANDA.
    """

    def __init__(self, tandas, items, tolerancia=5, semilla=2027):
        self.tandas = tandas
        self.items = items
        self.tol = tolerancia
        self.rng = random.Random(semilla)
        self.idx = {t['id']: i for i, t in enumerate(tandas)}
        self.grupos = {}
        for i, t in enumerate(tandas):
            self.grupos.setdefault(t['grupo'], []).append(i)
        # cadenas de episodios por serie, en orden canónico
        self.cadena = {}
        for k, it in enumerate(items):
            if it['serie']:
                self.cadena.setdefault(it['serie'][0], []).append(k)
        for s in self.cadena:
            self.cadena[s].sort(key=lambda k: items[k]['serie'][1])
        self.pos = {}
        for s, ks in self.cadena.items():
            for p, k in enumerate(ks):
                self.pos[k] = p
        self.libres = [k for k, it in enumerate(items) if not it['fijo']]
        self.peliculas = [k for k in self.libres if not items[k]['serie']]
        self.pesos = dict(mover_pelicula=P_MOVER_PELICULA, mover_episodio=P_MOVER_EPISODIO,
                          serie_en_tanda=P_SERIE_EN_TANDA, cumple=P_CUMPLE, hueco=0.2)

    # ------------------------------------------------------------ estado y costo

    def _armar(self, asignacion):
        self.bin = list(asignacion)
        n = len(self.tandas)
        self.pal = [0.0] * n
        self.min = [0.0] * n
        self.marcas = [dict() for _ in range(n)]
        for k, b in enumerate(self.bin):
            if b is not None:
                self._sumar(k, b, +1)

    def _sumar(self, k, b, signo):
        it = self.items[k]
        self.pal[b] += signo * it['palabras']
        self.min[b] += signo * it['minutos']
        m = self.marcas[b]
        for marca in it['marcas']:
            m[marca] = m.get(marca, 0) + signo

    def _costo_tanda(self, b):
        t = self.tandas[b]
        c = max(0.0, self.min[b] - t['max_min']) * P_MINUTO_DE_MAS
        for _, marcas, obligatorio in t['requisitos']:
            if not any(self.marcas[b].get(m, 0) > 0 for m in marcas):
                c += P_TEMA if obligatorio else self.pesos['cumple']
        c += self.pesos['serie_en_tanda'] * sum(1 for m, n in self.marcas[b].items() if n > 0 and m.startswith('serie:'))
        return c

    def _costo_grupo(self, g):
        bins = self.grupos[g]
        t = self.tandas[bins[0]]
        pal = sum(self.pal[b] for b in bins)
        c = max(0.0, pal - t['cuota'] - self.tol) * P_PALABRA_DE_MAS
        hueco = max(0.0, t['meta'] - pal)
        return c + self.pesos['hueco'] * hueco * hueco

    def _costo_item(self, k, b):
        it = self.items[k]
        if b is None:
            return P_SIN_TANDA if it.get('obligatorio', True) else 0
        if b == (self.idx.get(it['inicial']) if it['inicial'] is not None else None):
            return 0
        if it['inicial'] is None:
            return 0
        return self.pesos['mover_pelicula'] if it.get('pelicula', not it['serie']) else self.pesos['mover_episodio']

    def costo_total(self):
        c = sum(self._costo_tanda(b) for b in range(len(self.tandas)))
        c += sum(self._costo_grupo(g) for g in self.grupos)
        c += sum(self._costo_item(k, b) for k, b in enumerate(self.bin))
        return c

    def _delta(self, cambios):
        """cambios: [(item, tanda nueva)]. Devuelve la diferencia de costo y deja el estado igual."""
        afectadas = set()
        for k, nb in cambios:
            if self.bin[k] is not None:
                afectadas.add(self.bin[k])
            if nb is not None:
                afectadas.add(nb)
        grupos = {self.tandas[b]['grupo'] for b in afectadas}
        antes = sum(self._costo_tanda(b) for b in afectadas) + sum(self._costo_grupo(g) for g in grupos) + \
            sum(self._costo_item(k, self.bin[k]) for k, _ in cambios)
        viejos = [(k, self.bin[k]) for k, _ in cambios]
        self._aplicar(cambios)
        despues = sum(self._costo_tanda(b) for b in afectadas) + sum(self._costo_grupo(g) for g in grupos) + \
            sum(self._costo_item(k, nb) for k, nb in cambios)
        self._aplicar(viejos)
        return despues - antes

    def _aplicar(self, cambios):
        for k, nb in cambios:
            if self.bin[k] is not None:
                self._sumar(k, self.bin[k], -1)
            self.bin[k] = nb
            if nb is not None:
                self._sumar(k, nb, +1)

    # ------------------------------------------------------------ movimientos

    def _rango_episodio(self, k):
        """Tandas posibles para el episodio k sin romper el orden (None = sin tanda)."""
        s = self.items[k]['serie'][0]
        cad, p = self.cadena[s], self.pos[k]
        ultimo = len(self.tandas) - 1
        prev = self.bin[cad[p - 1]] if p > 0 else 0
        if p > 0 and prev is None:
            return None  # el anterior no tiene tanda: este tampoco puede tenerla
        sig = self.bin[cad[p + 1]] if p + 1 < len(cad) else None
        hi = sig if sig is not None else ultimo
        return (prev or 0, hi, sig is None)

    def _propuesta(self):
        r = self.rng.random()
        if r < 0.15 and len(self.peliculas) > 1:
            a, b = self.rng.sample(self.peliculas, 2)
            if self.bin[a] != self.bin[b]:
                return [(a, self.bin[b]), (b, self.bin[a])]
            return None
        k = self.rng.choice(self.libres)
        if not self.items[k]['serie']:
            nb = self.rng.randrange(len(self.tandas)) if self.rng.random() > 0.02 else None
            return [(k, nb)] if nb != self.bin[k] else None
        rango = self._rango_episodio(k)
        if rango is None:
            return None
        lo, hi, puede_quitarse = rango
        if puede_quitarse and self.rng.random() < 0.02:
            return [(k, None)] if self.bin[k] is not None else None
        nb = self.rng.randint(lo, hi)
        return [(k, nb)] if nb != self.bin[k] else None

    # ------------------------------------------------------------ búsqueda

    def resolver(self, asignacion_inicial, iteraciones=250_000, t_inicial=3000.0, t_final=0.5):
        self._armar(asignacion_inicial)
        costo = self.costo_total()
        mejor, mejor_bin = costo, list(self.bin)
        for i in range(iteraciones):
            temp = t_inicial * (t_final / t_inicial) ** (i / iteraciones)
            cambios = self._propuesta()
            if not cambios:
                continue
            d = self._delta(cambios)
            if d <= 0 or self.rng.random() < math.exp(-d / temp):
                self._aplicar(cambios)
                costo += d
                if costo < mejor - 1e-9:
                    mejor, mejor_bin = costo, list(self.bin)
        self._armar(mejor_bin)
        return mejor_bin, self.costo_total()
