import json
import os

data_dir = r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\pelis'

descriptions = {
    "A Rainy Day in New York": "En esta película, podrás familiarizarte con un vocabulario culto y ocasionalmente pretencioso, propio de la élite de Manhattan. El inglés es fluido, salpicado con referencias al arte, literatura y al cine clásico, ideal para aprender modismos sofisticados y coloquialismos neoyorquinos.",
    "Family Switch": "Una comedia familiar llena de humor situacional y un inglés muy cotidiano y coloquial. Es ideal para aprender jerga moderna, modismos familiares y expresiones adolescentes, ya que los personajes se ven forzados a usar vocabulario de diferentes generaciones.",
    "A Complete Unknown": "Situada en los años 60 y centrada en la vida de Bob Dylan, esta película ofrece un rico vocabulario musical y poético, así como expresiones propias de la contracultura, el folk y los artistas de la época. Excelente para aprender modismos históricos y la jerga bohemia.",
    "A Minecraft Movie": "Una aventura con un inglés directo, divertido y muy accesible. Cuenta con un vocabulario lleno de términos relacionados a la construcción, la aventura y la fantasía. Al ser una película para toda la familia, la dicción suele ser clara y las expresiones son de uso común.",
    "Love Actually": "Un clásico moderno que sirve como una clase maestra en los diferentes acentos británicos. La película presenta desde el RP (Received Pronunciation) del Primer Ministro, hasta acentos más coloquiales. Su vocabulario abarca situaciones románticas, laborales y familiares.",
    "Orgullo y Prejuicio": "Un escaparate del inglés británico del siglo XIX. El lenguaje es muy formal, educado y lleno de cortesías elaboradas. Es perfecto para sumergirse en una gramática más compleja, vocabulario avanzado de época y las sutilezas del romance clásico de alta cuna.",
    "Zootopia I": "Al ser una película animada, está repleta de excelentes juegos de palabras y dobles sentidos. El inglés americano es muy claro, ideal para todos los niveles, e incluye mucho vocabulario relacionado al trabajo policial, la burocracia y la vida en la gran ciudad.",
    "Schindler's List": "Una obra que maneja un tono serio y solemne. El vocabulario es formal y cargado de terminología histórica, empresarial y militar de la Segunda Guerra Mundial. Requiere un nivel más avanzado debido a la carga dramática y a los variados acentos europeos.",
    "Interestellar": "Una película imperdible para quienes buscan vocabulario técnico. Está llena de terminología científica relacionada con la astrofísica, la relatividad, la exploración espacial y la supervivencia. El tono es serio, con un acento estadounidense claro y firme."
}

for title, desc in descriptions.items():
    filepath = os.path.join(data_dir, f"{title}.json")
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        data["englishAnalysis"] = desc
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Updated {title}")
    else:
        print(f"File not found for {title}: {filepath}")
