import re

file_path = "dialogos gta vice city.txt"
with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

missions_content = {}
current_mission = "UNMAPPED_START"
missions_content[current_mission] = []

skip = 0
i = 0
while i < len(lines):
    if skip > 0:
        skip -= 1
        i += 1
        continue
    
    line = lines[i]
    s = line.strip()

    if not s:
        i += 1
        continue
        
    if re.match(r'^\d+$', s) and i + 1 < len(lines) and "00:00:00,000" in lines[i+1]:
        text = lines[i+2].strip()
        missions_content[current_mission].append(text)
        skip = 2
        i += 1
        continue
        
    if re.match(r'^[\-]+$', s) and i + 2 < len(lines) and re.match(r'^[\-]+$', lines[i+2].strip()):
        match = re.match(r'^([a-zA-Z0-9]+)\.\s+(.*)', lines[i+1].strip())
        if match:
            current_mission = match.group(2).strip()
            if current_mission not in missions_content:
                missions_content[current_mission] = []
            skip = 2
            i += 1
            continue

    if re.match(r'^[=]+$', s) and i + 2 < len(lines) and re.match(r'^[=]+$', lines[i+2].strip()):
        match = re.match(r'^([a-zA-Z0-9]+)\.\s+(.*)', lines[i+1].strip())
        if match:
            current_mission = match.group(2).strip()
            if current_mission not in missions_content:
                missions_content[current_mission] = []
            skip = 2
            i += 1
            continue

    i += 1

structure = [
    {"type": "category", "title": "Misiones Principales (Prólogo y Ken Rosenberg)", "key": None},
    {"type": "text", "text": "Estas misiones introducen la historia y se desbloquean de forma totalmente lineal."},
    {"type": "mission", "title": "In el principio... (In the beginning...) — Cinemática inicial", "key": "I N T R O"},
    {"type": "mission", "title": "An old friend — Cinemática en el hotel", "key": "AN OLD FRIEND"},
    {"type": "mission", "title": "La fiesta (The Party)", "key": "THE PARTY"},
    {"type": "mission", "title": "Pelea en el callejón (Back Alley Brawl)", "key": "BACK ALLEY BRAWL"},
    {"type": "mission", "title": "Furia del jurado (Jury Fury)", "key": "JURY FURY"},
    {"type": "mission", "title": "Disturbios (Riot)", "key": "RIOT"},

    {"type": "category", "title": "Misiones de Juan García Cortez (El Coronel)", "key": None},
    {"type": "mission", "title": "Un viejo conocido (Treacherous Swine)", "key": "TREACHEROUS SWINE"},
    {"type": "mission", "title": "El desafío del centro comercial (Mall Shootout)", "key": "MALL SHOOTOUT"},
    {"type": "mission", "title": "Ángeles guardianes (Guardian Angels)", "key": "GUARDIAN ANGELS"},

    {"type": "text", "text": "Nota: Tras Ángeles guardianes, la historia se divide temporalmente entre las misiones de Ricardo Díaz y las del Coronel."},

    {"type": "category", "title": "Continuación de Cortez", "key": None},
    {"type": "mission", "title": "Sir, yes sir!", "key": "SIR, YES SIR"},
    {"type": "mission", "title": "¡Todos a cubierta! (All Hands on Deck!)", "key": "ALL HANDS ON DECK"},

    {"type": "category", "title": "Misiones de Ricardo Díaz", "key": None},
    {"type": "mission", "title": "El cazador cazado (The Chase)", "key": "THE CHASE"},
    {"type": "mission", "title": "Phnom Penh '86", "key": "PHNOM PENH '86"},
    {"type": "mission", "title": "El más rápido de la lancha (Fastest Boat)", "key": "THE FASTEST BOAT"},
    {"type": "mission", "title": "Oferta y demanda (Supply & Demand)", "key": "SUPPLY AND DEMAND"},

    {"type": "category", "title": "El Punto de Inflexión (Tommy Vercetti)", "key": None},
    {"type": "text", "text": "Una vez hechas las misiones anteriores de Díaz y Cortez, se desbloquea el asalto a la mansión."},
    {"type": "mission", "title": "Borrar (Rub Out) — Aquí eliminas a Díaz y consigues la Mansión Vercetti.", "key": "RUB OUT"},
    {"type": "mission", "title": "Extorsión (Shakedown)", "key": "SHAKEDOWN"},
    {"type": "mission", "title": "Pelea de bar (Bar Brawl)", "key": "BAR BRAWL"},
    {"type": "mission", "title": "Cop Land", "key": "COPLAND"},

    {"type": "category", "title": "Misiones de Activos y Propiedades (Obligatorias para el Final)", "key": None},
    {"type": "text", "text": "Para desbloquear las misiones finales, debes comprar y completar las misiones de la Imprenta (Print Works) y de al menos otros 5 negocios a tu elección (6 propiedades en total con misiones completadas)."},

    {"type": "category", "title": "1. Imprenta (Print Works) — Obligatoria", "key": "P R I N T W O R K S"},
    {"type": "mission", "title": "Descubriendo el pastel (Spilling the Beans)", "key": "SPILLING THE BEANS"},
    {"type": "mission", "title": "El distribuidor (Hit the Courier)", "key": "HIT THE COURIER"},

    {"type": "category", "title": "2. Club Malibu (Malibu Club)", "key": "T H E M A L I B U"},
    {"type": "mission", "title": "No me lleves flores (No Escape?)", "key": "NO ESCAPE?"},
    {"type": "mission", "title": "El tirador (The Shootist)", "key": "THE SHOOTIST"},
    {"type": "mission", "title": "El conductor (The Driver)", "key": "THE DRIVER"},
    {"type": "mission", "title": "El atraco (The Job)", "key": "THE JOB"},

    {"type": "category", "title": "3. Astillero (Boatyard)", "key": "B O A T Y A R D"},

    {"type": "category", "title": "4. Fábrica de Helados Cherry Popper (Cherry Popper Ice Cream Factory)", "key": "C H E R R Y P O P P E R I C E C R E A M F A C T O R Y"},
    {"type": "text", "text": "Distribución (Vender 50 helados \"especiales\" en una sola tanda sin que te arreste la policía)."},

    {"type": "category", "title": "5. Taxis Kaufman (Kaufman Cabs)", "key": "K A U F M A N C A B S"},
    {"type": "mission", "title": "VIP", "key": "VIP"},
    {"type": "mission", "title": "Rivalidad amistosa (Friendly Rivalry)", "key": "FRIENDLY RIVALRY"},
    {"type": "mission", "title": "Cabmageddon", "key": "CABMAGEDDON"},

    {"type": "category", "title": "6. Club de Striptease Pole Position (Pole Position Club)", "key": None},
    {"type": "text", "text": "Gastar $600 dólares en el baile privado de la sala del fondo."},

    {"type": "category", "title": "7. Estudio de Cine InterGlobal (InterGlobal Films)", "key": "F I L M S T U D I O"},
    {"type": "mission", "title": "Campanilla de reclutamiento (Recruitment Drive)", "key": "RECRUITMENT DRIVE"},
    {"type": "mission", "title": "Consolador dodo (Dildo Dodo)", "key": "DILDO DODO"},
    {"type": "mission", "title": "Mantén cerca a tus amigos (Martha's Mug Shot)", "key": "MARTHA'S MUG SHOT"},
    {"type": "mission", "title": "Foco reflector (G-Spotlight)", "key": "G-SPOTLIGHT"},

    {"type": "category", "title": "8. Concesionario Sunshine Autos", "key": "S U N S H I N E A U T O S"},
    {"type": "text", "text": "Completar las 4 listas de autos robados que aparecen en el garaje del sótano."},

    {"type": "category", "title": "Misiones de Bandas (Secundarias pero necesarias en el mapa)", "key": None},
    {"type": "text", "text": "Aparecen mientras expandes tu imperio y debes hacerlas para avanzar en paralelo."},

    {"type": "category", "title": "Misiones de Avery Carrington (Constructor)", "key": None},
    {"type": "mission", "title": "Hierro cuatro (Four Iron)", "key": "FOUR IRON"},
    {"type": "mission", "title": "Demolición (Demolition Man) — La infame misión del helicóptero de radiocontrol.", "key": "DEMOLITION MAN"},
    {"type": "mission", "title": "Dos leves traumas (Two Bit Hit)", "key": "TWO BIT HIT"},

    {"type": "category", "title": "Misiones de Kent Paul (En el Club Malibu)", "key": None},
    {"type": "mission", "title": "El matasanos (Death Row) — Misión crucial donde salvas a Lance Vance.", "key": "DEATH ROW"},

    {"type": "category", "title": "Misiones de Love Fist (Banda de Rock)", "key": None},
    {"type": "mission", "title": "Juice de amor (Love Juice)", "key": "LOVE JUICE"},
    {"type": "mission", "title": "Asesino psicópata (Psycho Killer)", "key": "PSYCHO KILLER"},
    {"type": "mission", "title": "Gira publicitaria (Publicity Tour)", "key": "PUBLICITY TOUR"},

    {"type": "category", "title": "Misiones de Big Mitch Baker (Motero)", "key": None},
    {"type": "mission", "title": "Ruedas con garras (Alloy Wheels of Steel)", "key": "ALLOY WHEELS OF STEEL"},
    {"type": "mission", "title": "Incitación a la actividad armada (Messing with the Man)", "key": "MESSING WITH THE MAN"},
    {"type": "mission", "title": "Hog Tied", "key": "HOG TIED"},

    {"type": "category", "title": "Misiones de Umberto Robina (Los Cubanos)", "key": None},
    {"type": "mission", "title": "Esa ruda presentación (Stunt Boat Challenge)", "key": "STUNT BOAT CHALLENGE"},
    {"type": "mission", "title": "Carne de cañón (Cannon Fodder)", "key": "CANNON FODDER"},
    {"type": "mission", "title": "Encuentro naval (Naval Engagement)", "key": "NAVAL ENGAGEMENT"},
    {"type": "mission", "title": "Trojan Voodoo", "key": "TROJAN VOODOO"},

    {"type": "category", "title": "Misiones de Tía Poulet (Los Haitianos)", "key": None},
    {"type": "mission", "title": "Pociones Juju (Juju Scramble)", "key": "JUJU SCRAMBLE"},
    {"type": "mission", "title": "Bombas fuera (Bombs Away!)", "key": "BOMBS AWAY!"},
    {"type": "mission", "title": "Sucias malas artes (Dirty Lickin's)", "key": "DIRTY LICKIN'S"},

    {"type": "category", "title": "Misiones de Phil Cassidy", "key": None},
    {"type": "mission", "title": "Traficante de armas (Gun Runner)", "key": "GUN RUNNER"},
    {"type": "mission", "title": "Suministro de \"Boomshine\" (Boomshine Saigon)", "key": "BOOMSHINE SAIGON"},

    {"type": "category", "title": "El Gran Final", "key": "F I N A L M I S S I O N S"},
    {"type": "text", "text": "Cuando controlas la Imprenta y los otros 5 negocios (completando sus misiones), recibirás un par de llamadas telefónicas que activan el clímax del juego en la Mansión Vercetti."},
    {"type": "mission", "title": "Capo de la mafia (Cap the Collector)", "key": "CAP THE COLLECTOR"},
    {"type": "mission", "title": "Mantén cerca a tus amigos... (Keep Your Friends Close...) — Misión Final del juego.", "key": "KEEP YOUR FRIENDS CLOSE"}
]

out_lines = []
dialogue_count = 1
used_keys = set()

for item in structure:
    if item["type"] == "category":
        out_lines.append("===============================================================================\n")
        out_lines.append(f"{item['title']}\n")
        out_lines.append("===============================================================================\n\n")
        
        key = item.get("key")
        if key and key in missions_content and len(missions_content[key]) > 0:
            used_keys.add(key)
            for text in missions_content[key]:
                out_lines.append(f"{dialogue_count}\n")
                out_lines.append("00:00:00,000 --> 00:00:00,000\n")
                out_lines.append(f"{text}\n\n")
                dialogue_count += 1

    elif item["type"] == "text":
        out_lines.append(f"{item['text']}\n\n")

    elif item["type"] == "mission":
        key = item["key"]
        
        if key in missions_content and len(missions_content[key]) > 0:
            used_keys.add(key)
            out_lines.append("-------------------------------------------------------------------------------\n")
            out_lines.append(f"{item['title']}\n")
            out_lines.append("-------------------------------------------------------------------------------\n\n")
            
            for text in missions_content[key]:
                out_lines.append(f"{dialogue_count}\n")
                out_lines.append("00:00:00,000 --> 00:00:00,000\n")
                out_lines.append(f"{text}\n\n")
                dialogue_count += 1

unused_keys = set(missions_content.keys()) - used_keys
unmapped_dialogues = 0
for k in unused_keys:
    if len(missions_content[k]) > 0:
        unmapped_dialogues += len(missions_content[k])

if unmapped_dialogues > 0:
    out_lines.append("\n===============================================================================\n")
    out_lines.append("DIÁLOGOS NO MAPEADOS O EXTRAS\n")
    out_lines.append("===============================================================================\n\n")
    for k in unused_keys:
        if len(missions_content[k]) > 0:
            out_lines.append("-------------------------------------------------------------------------------\n")
            out_lines.append(f"{k}\n")
            out_lines.append("-------------------------------------------------------------------------------\n\n")
            for text in missions_content[k]:
                out_lines.append(f"{dialogue_count}\n")
                out_lines.append("00:00:00,000 --> 00:00:00,000\n")
                out_lines.append(f"{text}\n\n")
                dialogue_count += 1

with open(file_path, "w", encoding="utf-8") as f:
    f.writelines(out_lines)

print(f"Processed {dialogue_count - 1} dialogues. Unmapped: {unmapped_dialogues}")
