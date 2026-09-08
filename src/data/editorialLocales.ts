// Localized editorial summaries. Versions and scientific claims remain unchanged.
export const editorialLocales = {
  ja: {
    labels: ["最新情報", "概念イラスト", "今回の変更点", "項目", "更新前", "更新後", "関連資料", "元の更新履歴", "方法論"],
    source: "既存のリリース記録に基づく要約です。比較は画面と文書の変更を示し、未測定の速度や精度の向上を主張するものではありません。",
    stories: [
      { title:"研究の進展を見える形に", intro:"更新履歴、科学的マイルストーン、次の研究課題を整理し、変更から根拠までたどれるようにしました。", sections:[
        ["進展を明確に記録する", "v3.5.1 では、完了した変更を更新履歴に、研究の進展をマイルストーンに、今後の方向をロードマップに分けました。機能の実装と、まだ検証が必要な課題を区別できます。"],
        ["読みやすさを整える", "分野別の大きな色面や入れ子のカードを減らし、落ち着いた配色と見出しで説明と出典の関係を示しました。方法論は継続的に参照しやすい表示を維持します。"],
        ["進展と限界をともに示す", "画面が明快になっても科学的結論の信頼性が自動的に高まるわけではありません。更新記録は外部検証や実験の再現を代替せず、方法・データ・根拠への確認経路を提供します。"],
      ], comparison:[["進展", "情報をまとめて表示", "更新履歴・マイルストーン・計画を分離"],["表示", "色面と入れ子カード", "控えめな配色と連続した文章"],["閲覧", "状態を読者が判断", "完了事項と今後の方向を区別"]]},
      { title:"独立した区画から研究キャンバスへ", intro:"研究課題、データ、方法を一つの閲覧経路につなぎ、方法論の文献と実行条件を復元しました。", sections:[
        ["内容をつなぐ", "v3.5.0 は区画の境界と間隔を抑え、研究課題からデータと方法へ読み進められるようにしました。フィルターや状態表示もコンパクトに整理しました。"],
        ["手法名の先へ", "方法論には 34 件の文献由来の着想と、採用範囲に関する六つの分類を復元しました。目的、入力条件、実行状態、停止条件、フィールド監査を研究手順に沿って説明します。"],
        ["入口から根拠へ", "材料選定では出典、比較可能な条件、項目の完全性の確認が必要です。閲覧経路と文献の復元は検査を支援しますが、未測定の性能向上を意味しません。"],
      ], comparison:[["ホーム", "強い区画の境界", "連続したキャンバス"],["出典", "文献の復元が必要", "34 件の出典と採用範囲"],["実行", "項目別の説明が不足", "入力資格・状態・停止条件を追加"]]},
      { title:"データソースから実装へ", intro:"入力、索引、計算、出力、停止条件を明記し、研究上の判断を確認できる形にしました。", sections:[
        ["実装を確認する", "v3.4.2 は MOF ライブラリ、EcoScreen、GasSep、触媒、有機酸、項目の出典、検証経路の実装説明を補いました。入力から計算結果と停止条件までをつなぎます。"],
        ["発行元の資料を優先する", "データ利用条件のページを、六段階の図や表から番号付き文書に変更しました。許諾条件、免責事項、原文リンクを優先し、出典登録と絞り込みは維持しました。"],
        ["文書と検証を区別する", "説明の充実は欠けた実験や利用許諾を補いません。記録の同一性、項目の出典、研究条件を確認し、入力不足時の停止条件を結果と同様に明示します。"],
      ], comparison:[["実装", "説明の補完が必要", "入力から停止条件まで明記"],["出典", "図と表が中心", "発行元の原文を優先"],["利用範囲", "情報が分散", "実装と出典に併記"]]},
    ],
    research:[
      ["分子ファンで微量ベンゼンの捕集を改善", "Fe 系 ZJU-701 の回転ユニットが細孔内の拡散抵抗を緩和し、報告された条件下で吸着速度と容量を両立します。"],
      ["網状化学による電極触媒サイトの設計", "不均一触媒サイト周辺の化学環境を調整し、小分子の活性化を制御する網状化学の総説です。"],
      ["バイオディーゼル製造用の一体型 MOF 触媒", "ジルコニウム系の酸塩基二機能 MOF により、非食用油のワンポット変換と生成物分離を組み合わせます。"],
    ],
  },
  ko: {
    labels:["최신 소식", "개념 삽화", "이번 변경 사항", "항목", "변경 전", "변경 후", "관련 자료", "원본 업데이트 기록", "방법론"],
    source:"기존 릴리스 기록에 근거한 요약입니다. 비교는 화면과 문서의 변경을 설명하며, 측정하지 않은 속도나 정확도 향상을 주장하지 않습니다.",
    stories:[
      {title:"연구의 진전을 명확하게",intro:"업데이트 기록, 과학적 이정표와 다음 연구 과제를 연결하여 변경 사항에서 근거까지 추적할 수 있게 했습니다.",sections:[
        ["진행 상황을 구분하기", "v3.5.1은 완료된 변경을 업데이트 기록에, 연구 진전을 과학적 이정표에, 향후 방향을 로드맵에 배치했습니다. 구현한 기능과 검증이 필요한 질문을 구별할 수 있습니다."],
        ["읽기 경험 개선", "분야별 넓은 색상 영역과 중첩 카드를 줄였습니다. 절제된 색상과 명확한 제목으로 설명과 출처의 관계를 드러내고, 방법론은 지속적으로 참조하기 편한 형태를 유지합니다."],
        ["진전과 한계 함께 보기", "명확한 화면 자체가 과학적 결론의 신뢰성을 높이지는 않습니다. 릴리스 기록은 외부 검증이나 실험 재현을 대신하지 않으며, 방법·데이터·근거를 확인하는 경로를 제공합니다."],
      ],comparison:[["진행 기록","정보를 함께 표시","기록·이정표·계획 분리"],["시각 구조","색상과 중첩 카드","절제된 색상과 연속 문단"],["읽기 경로","독자가 상태를 구분","완료 사항과 향후 방향 구분"]]},
      {title:"개별 구역에서 연속 연구 공간으로",intro:"연구 질문, 데이터, 방법을 하나의 읽기 경로로 연결하고 문헌 출처와 실행 조건을 복원했습니다.",sections:[
        ["내용 연결하기","v3.5.0은 구역 경계를 완화하고 간격을 줄여 연구 질문에서 데이터와 방법으로 이어지는 경로를 만듭니다. 필터와 상태 표기도 간결하게 조정했습니다."],
        ["방법 이름 그 이상","방법론에 문헌 기반 아이디어 출처 34개와 적용 범위 6개 범주를 복원했습니다. 목적, 입력 자격, 실행 상태, 중단 조건, 필드 감사를 연구 흐름에 따라 설명합니다."],
        ["진입점에서 근거까지","재료 선별에는 출처, 비교 조건, 필드 완전성 확인이 필요합니다. 연속 화면과 복원된 문헌은 검토를 지원하지만, 측정되지 않은 성능 향상을 뜻하지 않습니다."],
      ],comparison:[["홈페이지","강한 구역 경계","연속 공간과 짧은 간격"],["방법 출처","참고문헌 복원 필요","출처 34개 및 적용 범위 복원"],["실행 설명","항목별 설명 부족","자격·상태·중단 조건 추가"]]},
      {title:"데이터 출처에서 구현까지",intro:"입력, 색인, 계산, 출력과 중단 조건을 명시해 연구 과정의 판단을 검토할 수 있게 했습니다.",sections:[
        ["구현 경로 확인","v3.4.2는 MOF 라이브러리, EcoScreen, GasSep, 촉매, 유기산, 필드 출처와 검증 경로의 구현 설명을 보완했습니다. 각 모듈의 입력부터 계산, 출력, 중단 조건까지 연결합니다."],
        ["발행기관 원문 우선","데이터 준수 페이지를 6단계 도표와 표에서 번호가 있는 문서로 전환했습니다. 라이선스, 면책 사항, 원문 링크를 우선하고 출처 등록과 필터는 유지했습니다."],
        ["문서와 검증 구분","충실한 설명이 누락된 실험이나 이용 허가를 대신하지는 않습니다. 기록의 정체성, 필드 출처, 연구 조건을 확인하고 입력 부족 시 중단 조건을 결과처럼 명확히 밝혀야 합니다."],
      ],comparison:[["모듈 설명","구현 경로 보완 필요","입력부터 중단까지 설명"],["출처 읽기","도표와 표 중심","번호 문서와 원문 우선"],["이용 범위","정보가 분산됨","구현 및 출처와 함께 표시"]]},
    ],
    research:[
      ["분자 팬으로 미량 벤젠 포집 개선","철 기반 ZJU-701의 회전 단위가 기공 확산 저항을 줄여 보고된 조건에서 흡착 속도와 용량을 함께 확보합니다."],
      ["망상 화학을 통한 전기촉매 자리 설계","불균일 촉매 자리 주변의 화학적 환경을 조절하여 작은 분자 활성화를 제어하는 망상 화학에 관한 리뷰입니다."],
      ["바이오디젤 생산을 위한 일체형 MOF 촉매","지르코늄 기반 산·염기 이중 기능 MOF로 비식용유의 원팟 전환과 생성물 분리를 결합합니다."],
    ],
  },
  es: {
    labels:["Últimas novedades","Ilustración conceptual","Qué cambia en esta versión","Área","Antes","Después","Más información","Registro original de cambios","Metodología"],
    source:"Resumen basado en los registros de publicación existentes. Las comparaciones describen cambios de interfaz y documentación, no mejoras de velocidad o precisión sin medir.",
    stories:[
      {title:"Hacer visible el progreso científico",intro:"Conectamos los cambios de la interfaz, los hitos científicos y las próximas preguntas en un recorrido trazable.",sections:[
        ["Distinguir el progreso","La versión 3.5.1 separa los cambios terminados en el historial, los avances científicos en los hitos y las direcciones futuras en la hoja de ruta. Así se distingue lo implementado de lo que todavía requiere validación."],
        ["Una lectura más clara","Se reducen las grandes áreas de color y las tarjetas anidadas. Una paleta discreta y títulos claros relacionan explicaciones y fuentes; la metodología conserva un formato adecuado para consultas continuadas."],
        ["Mostrar también los límites","Una interfaz más clara no demuestra por sí sola una conclusión científica más fiable. El historial no sustituye la validación externa ni la reproducción experimental: facilita volver a los métodos, datos y evidencias."],
      ],comparison:[["Progreso","Información reunida","Historial, hitos y planes separados"],["Jerarquía","Colores y tarjetas anidadas","Color discreto y texto continuo"],["Lectura","El lector distingue los estados","Trabajo terminado y futuro diferenciados"]]},
      {title:"De secciones aisladas a un espacio de investigación",intro:"Unimos preguntas, datos y métodos en un recorrido de lectura y recuperamos fuentes bibliográficas y condiciones de ejecución.",sections:[
        ["Conectar el contenido","La versión 3.5.0 suaviza los límites de las secciones y reduce sus espacios para pasar de una pregunta a sus datos y métodos. Los filtros y estados adoptan formas más compactas."],
        ["Más allá del nombre del método","La metodología recupera 34 fuentes de inspiración bibliográfica y seis categorías de límites de adopción. Explica objetivos, requisitos de entrada, estado de ejecución, condiciones de parada y auditoría de campos siguiendo el flujo de investigación."],
        ["Seguir el recorrido hasta la evidencia","La selección de materiales exige revisar fuentes, condiciones comparables e integridad de los campos. El espacio continuo y las referencias recuperadas facilitan esa revisión, sin implicar mejoras de rendimiento no medidas."],
      ],comparison:[["Inicio","Secciones muy delimitadas","Espacio continuo y menor separación"],["Fuentes","Referencias por recuperar","34 fuentes y límites recuperados"],["Ejecución","Detalles incompletos","Requisitos, estados y condiciones de parada"]]},
      {title:"De las fuentes de datos a la implementación",intro:"Documentamos entradas, índices, cálculos, salidas y condiciones de parada para poder revisar las decisiones de investigación.",sections:[
        ["Revisar la implementación","La versión 3.4.2 completa la documentación de la biblioteca MOF, EcoScreen, GasSep, catálisis, ácidos orgánicos, procedencia de campos y validación. Cada módulo conecta entradas, cálculos, salidas y condiciones de parada."],
        ["Volver a las fuentes originales","La página de cumplimiento sustituye el diagrama de seis pasos y las tablas por un documento numerado. Prioriza licencias, avisos y enlaces originales, manteniendo el registro y filtrado de fuentes."],
        ["Documentación no es validación","Documentar mejor no aporta experimentos ausentes ni modifica permisos de uso. Es necesario verificar identidad, procedencia y condiciones de cada registro. Si faltan entradas, las condiciones de parada importan tanto como los resultados."],
      ],comparison:[["Módulos","Implementación incompleta","Entradas y condiciones documentadas"],["Fuentes","Diagramas y tablas","Documento numerado y fuentes originales"],["Límites","Información dispersa","Junto a implementación y fuentes"]]},
    ],
    research:[
      ["Ventiladores moleculares para captar trazas de benceno","Las unidades giratorias de ZJU-701, basado en hierro, reducen la resistencia a la difusión y equilibran velocidad y capacidad de adsorción en las condiciones publicadas."],
      ["Diseñar sitios electrocatalíticos con química reticular","Una revisión de cómo la química reticular ajusta el entorno de los sitios heterogéneos para activar moléculas pequeñas."],
      ["Un catalizador MOF monolítico para producir biodiésel","Un MOF de zirconio con funciones ácidas y básicas combina la conversión en un solo recipiente de aceites no comestibles y la separación de productos."],
    ],
  },
}
