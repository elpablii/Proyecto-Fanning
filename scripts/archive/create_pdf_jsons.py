import json
import os

unknown_text = """Danke schon (en alemán): gracias de antemano, muchas gracias
Zaps: descargas (eléctricas)
Bits and pieces (frase no literal): cosas varias
Meine Frau (en alemán): mi esposa
Flamboyant: extravagante
The forefront of the media spotlight: en el centro de la atención de los medios
Can I have a quiet word?: ¿Podemos hablar un momento a solas?
An overnight low (en meteorología): una mínima nocturna
Throughout tomorrow: durante todo el día de mañana
Random (no alusivo a aleatorio): fortuito
Seamlessly: sin que nadie se de cuenta
Meter: medidor
Wiper switch: interruptor de los limpiaparabrisas
Get left behind: quedarse atrás
Hochschule fur Technik (en alemán): Universidad de Tecnología
Donkey cart: carreta tirada por un burro
Tannery: curtiduría
It's a hell of a thing (parcialmente no literal): es algo increíble
Second-to-none: inigualable
It was untidy (forma no literal): daba mala impresión
Junkie: adicto, yonqui, drogadicto
Stamp: sello
Pull up the recordings: busca las grabaciones
Strain of corn: variedad de maíz
Sustenance: sustento
Plunge (verbo): caer, desplomar"""

lilo_text = """Circa: alrededor de
Drop out this window: caer por esta ventana
Prognosis: pronóstico
Flying by: pasando volando
I got my technique down: ya dominé la técnica
Don't bite my head off (frase no literal): no me grites
Mop (verbo): pasar el trapeador
Ten days to a slimmer you: diez días para estar más delgado
It made me look top-heavy: me hacía ver con mucho peso en la parte de arriba
Rain check (verbo no literal): dejarlo para otro momento
Graceful: elegante
Skydive: salto en paracaídas
Alien eyeball dumplings: bollitos con forma de ojo de extraterrestre
Blubber (verbo): lloriquear
I sorry to break it to you: lamento tener que decírtelo
Fizzle (verbo en relaciones): enfriar, desvanecer, esfumarse
A fizzle is a fizzle: lo que se esfuma, se esfuma
Shut (someone) out: dejar fuera (a alguien)
Aw, jigglebig (verbo): ay, qué movidito eres
Bonding: unión
Go haywire (verbo): volverse loco
Puffy: esponjoso, voluminoso
Buzzard: buitre
Even Elvis slipped up sometimes: hasta Elvis cometía errores de vez en cuando
Bugle plays reveille (acotación): la corneta toca la diana
At ease (expresión): descansen, a discreción
He got things done (frase no literal): siempre lograba sus objetivos
Hovercraft: aerodeslizador
Rubbernecking: curiosear
Rye, sourdough: centeno, masa madre
Be cool: mantener la calma
Deltoid: deltoideo
I got the hi-fi high and the lights down low: tengo el sistema de sonido a todo volumen y las luces bien bajas
Badness: maldad
Tunelessly: desentonadamente
You're dead meat (frase no literal): estás perdido
Fizzling (acotación no literal): se apaga
Loud gulping (acotación): trago ruidoso
Faux pearls: perlas de imitación
They are marked down for clearance (frase no literal): están en oferta por liquidación
Engage hyper-drive: activar hiperpropulsión"""

def parse_text(text, movie_title):
    res_raw = []
    res_flash = []
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    for i, line in enumerate(lines):
        if ":" in line:
            parts = line.split(':', 1)
            word = parts[0].strip()
            trans = parts[1].strip()
            res_raw.append({
                "id": f"v_{movie_title}_{i}",
                "word": word,
                "translation": trans,
                "source_movie": movie_title,
                "year_processed": "2026",
                "global_frequency": 1
            })
            res_flash.append({"word": word, "translation": trans})
    return res_raw, res_flash

unk_raw, unk_flash = parse_text(unknown_text, "Unknown")
lilo_raw, lilo_flash = parse_text(lilo_text, "Lilo and Stitch II")

dir_2026 = r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\2026"
dir_pelis = r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\pelis"

# Save raw
with open(os.path.join(dir_2026, "vocabulario_unknown.json"), 'w', encoding='utf-8') as f:
    json.dump(unk_raw, f, ensure_ascii=False, indent=2)

with open(os.path.join(dir_2026, "vocabulario_lilo_and_stitch_ii.json"), 'w', encoding='utf-8') as f:
    json.dump(lilo_raw, f, ensure_ascii=False, indent=2)

# Save flashcards
desc_unk = "Con base en los diálogos del documento 'Dialogues from Unknown to improve the vocabulary in English.pdf', este thriller presenta un vocabulario lleno de tensión y lenguaje relacionado con la identidad. Encontrarás diálogos directos, expresiones de misterio y términos vinculados a la investigación criminal."
with open(os.path.join(dir_pelis, "Unknown.json"), 'w', encoding='utf-8') as f:
    json.dump({
        "title": "Unknown",
        "englishAnalysis": desc_unk,
        "vocabulary": unk_flash
    }, f, ensure_ascii=False, indent=2)

desc_lilo = "Utilizando como referencia 'Dialogues from Lilo and Stitch II to improve the vocabulary in English.pdf', esta película ofrece un inglés sumamente familiar y relajado. Contiene jerga hawaiana mezclada con términos alienígenas cómicos y vocabulario cotidiano sobre la familia y la amistad."
with open(os.path.join(dir_pelis, "Lilo and Stitch II.json"), 'w', encoding='utf-8') as f:
    json.dump({
        "title": "Lilo and Stitch II",
        "englishAnalysis": desc_lilo,
        "vocabulary": lilo_flash
    }, f, ensure_ascii=False, indent=2)

print("Created JSONs for Unknown and Lilo and Stitch II")
