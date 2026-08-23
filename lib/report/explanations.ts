/**
 * Educational copy for biomarker detail panels.
 * Lifestyle-level language only — no diagnosis claims.
 */

export type LearnMoreLink = {
  label: string;
  url: string;
};

export type BiomarkerExplanation = {
  /** Short “what is this?” lead */
  summary: string;
  /** Deeper physiology / what the lab measures */
  whatItMeasures: string;
  /** Why people track it (associations, not diagnoses) */
  whyItMatters: string;
  /** How to read high/low in plain language */
  understandingLevels: string;
  /** Lifestyle ideas when values trend higher */
  ifHigher?: string[];
  /** Lifestyle ideas when values trend lower */
  ifLower?: string[];
  influencingFactors: string[];
  learnMore?: LearnMoreLink[];
  discussWithClinician: string;
};

const DISCUSS_DEFAULT =
  "Share this result with a qualified clinician along with symptoms, medications, and the rest of your panel — this app does not diagnose conditions.";

function base(
  partial: Omit<BiomarkerExplanation, "discussWithClinician"> & {
    discussWithClinician?: string;
  },
): BiomarkerExplanation {
  return {
    ...partial,
    discussWithClinician: partial.discussWithClinician ?? DISCUSS_DEFAULT,
  };
}

export const BIOMARKER_EXPLANATIONS: Record<string, BiomarkerExplanation> = {
  "total-cholesterol": base({
    summary:
      "Total cholesterol adds up cholesterol carried by lipoproteins in your blood (mainly LDL, HDL, and VLDL).",
    whatItMeasures:
      "A single blood number that reflects overall circulating cholesterol. Labs often report it alongside LDL, HDL, and triglycerides so each piece can be interpreted separately.",
    whyItMatters:
      "Higher total cholesterol is commonly linked with greater long-term atherosclerotic risk in population studies, but modern care usually focuses more on LDL, non-HDL, and personal risk factors than on total cholesterol alone.",
    understandingLevels:
      "Values in the lab “desirable” band are common targets on educational panels, but your clinician may emphasize LDL or non-HDL instead. A single elevated total cholesterol does not by itself mean you have heart disease.",
    ifHigher: [
      "Emphasize fiber-rich foods, unsaturated fats, and overall calorie balance",
      "Stay physically active most days of the week",
      "Review family history and medications with your clinician",
    ],
    influencingFactors: [
      "Dietary saturated fat and overall calorie balance",
      "Physical activity and body composition",
      "Genetics and family history of high cholesterol",
      "Certain medications and thyroid or metabolic conditions",
    ],
    learnMore: [
      {
        label: "CDC — Cholesterol",
        url: "https://www.cdc.gov/cholesterol/about/index.html",
      },
      {
        label: "AHA — About Cholesterol",
        url: "https://www.heart.org/en/health-topics/cholesterol/about-cholesterol",
      },
    ],
    discussWithClinician:
      "Ask how your total cholesterol fits with LDL, HDL, triglycerides, and your overall cardiovascular risk — not as a standalone diagnosis.",
  }),

  "ldl-cholesterol": base({
    summary:
      "LDL (“bad”) cholesterol is the lipoprotein fraction most strongly linked with plaque buildup in arteries.",
    whatItMeasures:
      "The amount of cholesterol carried by low-density lipoprotein particles. Some labs calculate LDL from a formula; others measure it directly.",
    whyItMatters:
      "Guidelines often use LDL (along with overall risk) when discussing heart and vessel health. Lower LDL is generally associated with lower long-term atherosclerotic risk in research populations.",
    understandingLevels:
      "Lower LDL is generally preferred for long-term vessel health, but personal targets depend on age, blood pressure, diabetes status, smoking, and other risk factors — not a one-size-fits-all number.",
    ifHigher: [
      "Increase soluble fiber (oats, beans, fruit) and reduce saturated fat",
      "Prioritize aerobic activity and resistance training",
      "Discuss whether lifestyle alone or medication is appropriate for your risk",
    ],
    influencingFactors: [
      "Saturated fat intake and fiber-rich foods",
      "Weight, activity level, and sleep",
      "Genetic lipid disorders",
      "Statins and other lipid-lowering therapies (if prescribed)",
    ],
    learnMore: [
      {
        label: "AHA — LDL Cholesterol",
        url: "https://www.heart.org/en/health-topics/cholesterol/about-cholesterol/what-your-cholesterol-levels-mean",
      },
    ],
    discussWithClinician:
      "Targets for LDL depend on personal risk — consider reviewing your full lipid panel and risk factors with a clinician rather than chasing a single number alone.",
  }),

  "hdl-cholesterol": base({
    summary:
      "HDL (“good”) cholesterol helps transport cholesterol away from tissues toward the liver for processing.",
    whatItMeasures:
      "Cholesterol carried on high-density lipoprotein particles. Sex-specific lab cutpoints are common because average HDL differs between men and women.",
    whyItMatters:
      "Higher HDL is often associated with more favorable cardiovascular profiles in observational data, but raising HDL with drugs has not consistently proven benefit — context from the rest of the lipid panel matters.",
    understandingLevels:
      "Very low HDL often travels with higher triglycerides and metabolic risk. Very high HDL is usually fine but is not automatically “better” without the rest of your lipid and risk picture.",
    ifLower: [
      "Increase aerobic exercise",
      "Avoid smoking",
      "Improve body composition and sleep quality",
    ],
    influencingFactors: [
      "Aerobic exercise and not smoking",
      "Body composition and waist circumference",
      "Alcohol intake (discuss individually — not a recommendation to drink)",
      "Genetics and some medications",
    ],
    learnMore: [
      {
        label: "CDC — HDL Cholesterol",
        url: "https://www.cdc.gov/cholesterol/about/index.html",
      },
    ],
    discussWithClinician:
      "Very low or unusually high HDL is worth reviewing with a clinician alongside triglycerides, LDL, and metabolic health markers.",
  }),

  triglycerides: base({
    summary:
      "Triglycerides are the main form of fat circulating in blood after meals and during fasting.",
    whatItMeasures:
      "Blood triglyceride concentration, usually after an overnight fast. Non-fasting samples can run higher after a fatty meal.",
    whyItMatters:
      "Elevated triglycerides are commonly linked with metabolic syndrome, insulin resistance, excess alcohol, and higher cardiovascular risk when combined with other lipid abnormalities.",
    understandingLevels:
      "Mild elevations are common and often respond to lifestyle changes. Very high triglycerides can raise pancreatitis risk and need prompt clinical attention.",
    ifHigher: [
      "Limit refined carbohydrates, sugary drinks, and excess alcohol",
      "Favor fiber, protein, and unsaturated fats",
      "Increase physical activity and improve sleep",
    ],
    influencingFactors: [
      "Carbohydrate quality, alcohol, and calorie surplus",
      "Physical activity and waist circumference",
      "Genetics and diabetes or thyroid status",
      "Certain medications",
    ],
    learnMore: [
      {
        label: "AHA — Triglycerides",
        url: "https://www.heart.org/en/health-topics/cholesterol/about-cholesterol/what-your-cholesterol-levels-mean",
      },
    ],
  }),

  "lp-a": base({
    summary:
      "Lipoprotein(a), or Lp(a), is an LDL-like particle with an extra protein (apolipoprotein(a)) attached.",
    whatItMeasures:
      "Circulating Lp(a) concentration. Assays may report mg/dL or nmol/L — they are not interchangeable without a conversion specific to the assay.",
    whyItMatters:
      "Higher Lp(a) is associated with greater lifelong atherosclerotic and aortic valve risk in population studies. Levels are largely genetic and relatively stable in adulthood.",
    understandingLevels:
      "Lifestyle has limited effect on Lp(a) itself. The number mainly informs long-term risk discussion alongside LDL and overall cardiovascular risk.",
    influencingFactors: [
      "Genetics (primary driver)",
      "Kidney disease and inflammation (can shift levels modestly)",
      "Assay method and reporting units",
    ],
    learnMore: [
      {
        label: "AHA — Lipoprotein(a)",
        url: "https://www.heart.org/en/health-topics/cholesterol/genetic-conditions/lipoprotein-a",
      },
    ],
    discussWithClinician:
      "Ask whether your Lp(a) changes how aggressively other risk factors (especially LDL) should be managed — this is not a diagnosis by itself.",
  }),

  "glucose-fasting": base({
    summary:
      "Fasting glucose is blood sugar measured after not eating for several hours (typically 8+).",
    whatItMeasures:
      "How high glucose sits in the blood in a fasted state. It is one screening tool for metabolic health; A1C and glucose tolerance tests provide complementary information.",
    whyItMatters:
      "Values in the impaired fasting range are commonly linked with higher risk of progressing toward diabetes. A single result can also reflect illness, stress, medications, or incomplete fasting.",
    understandingLevels:
      "Educational bands often treat roughly <100 mg/dL as typical fasting, 100–125 as impaired fasting glucose territory, and ≥126 as in the diabetes-screening range on a fasting sample — but only a clinician can diagnose diabetes, usually with repeat or confirmatory testing.",
    ifHigher: [
      "Prioritize walking after meals and regular resistance training",
      "Emphasize whole foods and reduce sugary drinks",
      "Improve sleep and manage stress where possible",
    ],
    ifLower: [
      "Confirm the sample was truly fasting and you were not acutely ill",
      "Discuss symptoms such as shakiness or sweating with a clinician if they occur",
    ],
    influencingFactors: [
      "Carbohydrate quality/quantity and meal timing",
      "Physical activity and muscle mass",
      "Sleep, stress, and illness",
      "Body weight and insulin sensitivity",
    ],
    learnMore: [
      {
        label: "CDC — Diabetes testing",
        url: "https://www.cdc.gov/diabetes/diabetes-testing/index.html",
      },
      {
        label: "ADA — Understanding A1C & glucose",
        url: "https://diabetes.org/about-diabetes/diagnosis",
      },
    ],
    discussWithClinician:
      "Confirm whether the sample was truly fasting and whether repeat testing or A1C would help interpret the result — this app does not diagnose diabetes.",
  }),

  urea: base({
    summary:
      "BUN (blood urea nitrogen) is a waste product from protein metabolism filtered by the kidneys. US labs report BUN; some European labs report urea instead (urea mg/dL ≈ BUN × 2.14).",
    whatItMeasures:
      "How much urea nitrogen is in blood, as BUN in mg/dL. US labs print BUN; many European/Spanish labs print urea mass (urea mg/dL ≈ BUN × 2.14). On upload, a label of Urea (not BUN / urea nitrogen) is converted to BUN before grading so both report styles land on the same Mayo interval.",
    whyItMatters:
      "BUN rises when kidney filtration falls, when protein intake is high, or when you are dehydrated. It is interpreted with creatinine, eGFR, and clinical context — not alone.",
    understandingLevels:
      "A value inside the lab interval is common. Mildly high BUN with normal creatinine can reflect dehydration or a high-protein meal pattern. Rising BUN with rising creatinine more often prompts kidney-function review.",
    ifHigher: [
      "Ensure adequate hydration unless fluid-restricted by a clinician",
      "Review recent high-protein intake, intense exercise, or illness",
    ],
    influencingFactors: [
      "Hydration status",
      "Dietary protein load",
      "Kidney function and medications (e.g. diuretics)",
      "Gastrointestinal bleeding or catabolic illness (clinical contexts)",
    ],
    learnMore: [
      {
        label: "Mayo Clinic Laboratories — BUN",
        url: "https://www.mayocliniclabs.com/test-catalog/overview/81793/blood-urea-nitrogen-bun-serum",
      },
      {
        label: "MedlinePlus — BUN",
        url: "https://medlineplus.gov/lab-tests/bun-blood-urea-nitrogen/",
      },
    ],
  }),

  creatinine: base({
    summary:
      "Creatinine is a breakdown product of muscle creatine and a standard marker used to estimate kidney filtration.",
    whatItMeasures:
      "Serum creatinine concentration. Because muscle mass differs by sex, age, and body size, the same number can mean different things for different people — eGFR accounts for some of that.",
    whyItMatters:
      "Rising creatinine can reflect reduced kidney filtration, dehydration, certain medications, or high muscle turnover. Falling creatinine can reflect low muscle mass.",
    understandingLevels:
      "Interpret creatinine with eGFR (if provided), urine findings, blood pressure, and medications. A single mildly out-of-range value often needs confirmation and trend review.",
    ifHigher: [
      "Review hydration and recent intense exercise or creatine supplements",
      "Bring a full medication list (including NSAIDs) to your clinician",
    ],
    influencingFactors: [
      "Muscle mass and sex",
      "Hydration and acute illness",
      "Kidney function",
      "Medications that affect filtration or creatinine secretion",
    ],
    learnMore: [
      {
        label: "NIDDK — Kidney tests",
        url: "https://www.niddk.nih.gov/health-information/kidney-disease/chronic-kidney-disease-ckd/tests-diagnosis",
      },
    ],
  }),

  "uric-acid": base({
    summary:
      "Uric acid is the end product of purine metabolism; the kidneys and gut clear most of it.",
    whatItMeasures:
      "Serum urate concentration. Labs and guidelines use different cutoffs by sex; hydration and recent diet can shift a single draw.",
    whyItMatters:
      "Higher uric acid is associated with gout flares in susceptible people and often travels with metabolic syndrome features. Many people with mildly high uric acid never develop gout.",
    understandingLevels:
      "Elevation alone is not the same as gout. Low values are less often clinically urgent but can appear with certain medications or rare metabolic states — discuss unexpected results.",
    ifHigher: [
      "Limit sugar-sweetened beverages and excess alcohol (especially beer)",
      "Maintain healthy weight and stay hydrated",
      "Emphasize vegetables, low-fat dairy, and overall balanced eating patterns studied in gout prevention research",
    ],
    influencingFactors: [
      "Genetics and sex hormones",
      "Kidney function and diuretics",
      "Purine-rich foods, fructose, and alcohol",
      "Body weight and metabolic health",
    ],
    learnMore: [
      {
        label: "CDC — Gout",
        url: "https://www.cdc.gov/arthritis/gout/index.html",
      },
      {
        label: "Mayo Clinic — High uric acid",
        url: "https://www.mayoclinic.org/symptoms/high-uric-acid/basics/definition/sym-20050607",
      },
    ],
  }),

  alt: base({
    summary:
      "ALT (alanine aminotransferase) is an enzyme concentrated in liver cells; blood levels can rise when liver cells are stressed or injured.",
    whatItMeasures:
      "Enzyme activity in serum, reported in U/L. Upper limits of normal vary by lab, assay, sex, and body size — always prefer the reference interval printed on your report when available.",
    whyItMatters:
      "Mild elevations are common and can relate to fatty liver, medications, alcohol, exercise, or viral illness. Persistent or large elevations deserve clinical evaluation.",
    understandingLevels:
      "A single mild ALT bump is common. Patterns over time, AST/ALT ratio, GGT, ultrasound, and metabolic risk factors usually matter more than one isolated number.",
    ifHigher: [
      "Limit alcohol and review medications/supplements with a clinician or pharmacist",
      "Support metabolic health through activity and nutrition",
      "Avoid intense workouts the day before a repeat liver panel if advised",
    ],
    influencingFactors: [
      "Alcohol use and medication/supplement exposures",
      "Metabolic health and excess visceral fat",
      "Viral hepatitis and other liver conditions",
      "Intense exercise shortly before the blood draw",
    ],
    learnMore: [
      {
        label: "AASLD / patient liver info (MedlinePlus ALT)",
        url: "https://medlineplus.gov/lab-tests/alt-blood-test/",
      },
    ],
    discussWithClinician:
      "Share your lab’s specific reference range and any symptoms, medications, or alcohol use. Do not interpret ALT in isolation.",
  }),

  ast: base({
    summary:
      "AST (aspartate aminotransferase) is an enzyme found in liver, muscle, heart, and other tissues.",
    whatItMeasures:
      "Serum AST activity. Because AST is less liver-specific than ALT, muscle strain or other tissue stress can raise it too.",
    whyItMatters:
      "AST is interpreted with ALT, GGT, and clinical context. Isolated AST rises after hard exercise are common and often transient.",
    understandingLevels:
      "When AST and ALT rise together, clinicians often think first about liver stress. AST rising out of proportion can sometimes point to muscle or other sources — patterns matter.",
    ifHigher: [
      "Note recent strenuous exercise before the draw",
      "Limit alcohol and review medications with a clinician",
    ],
    influencingFactors: [
      "Liver stress and metabolic liver disease",
      "Muscle injury or intense training",
      "Alcohol and medications",
      "Other systemic illness",
    ],
    learnMore: [
      {
        label: "MedlinePlus — AST",
        url: "https://medlineplus.gov/lab-tests/ast-test/",
      },
    ],
  }),

  ggt: base({
    summary:
      "GGT (gamma-glutamyl transferase) is a liver and biliary enzyme sensitive to alcohol, medications, and cholestatic processes.",
    whatItMeasures:
      "Serum GGT activity. It often rises with alcohol exposure, fatty liver, enzyme-inducing drugs, or bile-flow issues.",
    whyItMatters:
      "GGT helps contextualize an elevated alkaline phosphatase (ALP): high ALP + high GGT points more toward a liver/bile source than a bone source.",
    understandingLevels:
      "Mild GGT elevations are common. Large or persistent elevations, especially with other abnormal liver tests, warrant clinical review.",
    ifHigher: [
      "Reduce or pause alcohol and recheck when advised",
      "Review medications and supplements that induce liver enzymes",
    ],
    influencingFactors: [
      "Alcohol intake",
      "Metabolic liver disease",
      "Medications",
      "Biliary obstruction or cholestasis (clinical contexts)",
    ],
    learnMore: [
      {
        label: "MedlinePlus — GGT",
        url: "https://medlineplus.gov/lab-tests/gamma-glutamyl-transferase-ggt-test/",
      },
    ],
  }),

  hemoglobin: base({
    summary:
      "Hemoglobin is the oxygen-carrying protein inside red blood cells.",
    whatItMeasures:
      "How much hemoglobin is in a given volume of blood (g/dL). It is a core CBC marker used when evaluating oxygen-carrying capacity and anemia risk.",
    whyItMatters:
      "Low hemoglobin can relate to iron deficiency, blood loss, chronic disease, or other causes of anemia. High values can relate to smoking, altitude, dehydration, or less common conditions.",
    understandingLevels:
      "Sex-specific ranges are standard. Pair hemoglobin with hematocrit, MCV, ferritin, and symptoms (fatigue, shortness of breath, heavy periods) for a fuller picture.",
    ifLower: [
      "Discuss iron, B12, and folate status with a clinician before supplementing",
      "Note any bleeding, menstrual changes, or digestive symptoms",
    ],
    ifHigher: [
      "Ensure you were well hydrated for the draw",
      "Mention smoking status and altitude exposure",
    ],
    influencingFactors: [
      "Iron, B12, and folate status",
      "Bleeding, menstruation, and pregnancy (when relevant)",
      "Kidney disease and chronic inflammation",
      "Smoking, altitude, and hydration status",
    ],
    learnMore: [
      {
        label: "NHLBI — Anemia",
        url: "https://www.nhlbi.nih.gov/health/anemia",
      },
    ],
    discussWithClinician:
      "CBC context (hematocrit, MCV, ferritin, etc.) usually matters more than hemoglobin alone — bring the full panel to your clinician.",
  }),

  hematocrit: base({
    summary:
      "Hematocrit is the fraction of blood volume made up of red blood cells.",
    whatItMeasures:
      "Packed red-cell volume as a percentage of whole blood. It usually moves in the same direction as hemoglobin.",
    whyItMatters:
      "Low hematocrit tracks with anemia syndromes; high hematocrit can reflect dehydration, smoking, altitude, or less common marrow/oxygen-sensing issues.",
    understandingLevels:
      "Interpret with hemoglobin and hydration. A high hematocrit after a hot workout may simply mean you need fluids — trends and symptoms guide next steps.",
    influencingFactors: [
      "Red-cell mass and plasma volume",
      "Hydration",
      "Sex hormones and altitude",
      "Smoking and chronic lung disease (clinical contexts)",
    ],
    learnMore: [
      {
        label: "MedlinePlus — Hematocrit",
        url: "https://medlineplus.gov/lab-tests/hematocrit-test/",
      },
    ],
  }),

  rbc: base({
    summary:
      "RBC count is the number of red blood cells in a volume of blood.",
    whatItMeasures:
      "Red blood cells per microliter (often written ×10⁶/µL). Together with hemoglobin, hematocrit, and indices (MCV/MCH/MCHC), it describes red-cell mass and size.",
    whyItMatters:
      "Low counts accompany many anemias; high counts can accompany dehydration, hypoxia, or polycythemia — always with clinical context.",
    understandingLevels:
      "RBC alone rarely tells the whole story. MCV helps separate microcytic, normocytic, and macrocytic patterns that point to different workups.",
    influencingFactors: [
      "Iron and nutrient status",
      "Kidney erythropoietin production",
      "Bone marrow function",
      "Hydration and altitude",
    ],
    learnMore: [
      {
        label: "MedlinePlus — RBC count",
        url: "https://medlineplus.gov/lab-tests/red-blood-cell-rbc-count/",
      },
    ],
  }),

  wbc: base({
    summary:
      "WBC (white blood cell) count totals circulating immune cells in blood.",
    whatItMeasures:
      "Leukocytes per microliter, including neutrophils, lymphocytes, monocytes, eosinophils, and basophils. A differential breaks the total into types.",
    whyItMatters:
      "WBC rises with infection, inflammation, stress, smoking, and steroids; it can fall with viral illness, medications, or marrow problems. Timing and the differential matter.",
    understandingLevels:
      "A mildly high or low WBC on one draw is common. Persistent abnormalities, fever, night sweats, easy bruising, or extreme values need clinical review.",
    influencingFactors: [
      "Acute and chronic infection or inflammation",
      "Stress, smoking, and corticosteroids",
      "Bone marrow function and medications",
      "Time of day and recovery from exercise",
    ],
    learnMore: [
      {
        label: "MedlinePlus — WBC count",
        url: "https://medlineplus.gov/lab-tests/white-blood-count-wbc/",
      },
    ],
  }),

  platelets: base({
    summary:
      "Platelets are cell fragments that help form clots and stop bleeding.",
    whatItMeasures:
      "Platelet count per microliter (often ×10³/µL). PDW/MPV (when reported) describe platelet size variability.",
    whyItMatters:
      "Low platelets can increase bleeding tendency; very high counts can relate to iron deficiency, inflammation, or marrow disorders. Mild shifts are common and often transient.",
    understandingLevels:
      "Labs flag counts outside their interval; clinical concern depends on how low/high, trends, medications (e.g. heparin), and bleeding/clotting symptoms.",
    influencingFactors: [
      "Immune destruction or consumption",
      "Bone marrow production",
      "Medications and alcohol",
      "Inflammation and iron deficiency",
    ],
    learnMore: [
      {
        label: "NHLBI — Thrombocytopenia",
        url: "https://www.nhlbi.nih.gov/health/thrombocytopenia",
      },
    ],
  }),

  mcv: base({
    summary:
      "MCV (mean corpuscular volume) is the average size of your red blood cells.",
    whatItMeasures:
      "Average red-cell volume in femtoliters (fL). It helps classify anemias as microcytic, normocytic, or macrocytic.",
    whyItMatters:
      "Low MCV often prompts iron-deficiency or thalassemia trait evaluation; high MCV can relate to B12/folate issues, alcohol, medications, or reticulocytosis.",
    understandingLevels:
      "MCV is most useful with hemoglobin, RDW, and ferritin/B12/folate — not as a standalone diagnosis.",
    influencingFactors: [
      "Iron status",
      "B12 and folate status",
      "Alcohol and medications",
      "Inherited red-cell traits",
    ],
    learnMore: [
      {
        label: "MedlinePlus — MCV",
        url: "https://medlineplus.gov/lab-tests/mcv-mean-corpuscular-volume/",
      },
    ],
  }),

  mch: base({
    summary:
      "MCH (mean corpuscular hemoglobin) is the average amount of hemoglobin per red blood cell.",
    whatItMeasures:
      "Hemoglobin content per red cell (pg). It usually moves with MCV.",
    whyItMatters:
      "Low MCH often accompanies microcytic anemias; high MCH often accompanies macrocytosis. It supports pattern recognition rather than acting alone.",
    understandingLevels:
      "Use MCH with MCV, MCHC, and iron studies for a coherent red-cell story.",
    influencingFactors: [
      "Iron availability",
      "Red-cell size (MCV)",
      "B12/folate status",
    ],
  }),

  mchc: base({
    summary:
      "MCHC (mean corpuscular hemoglobin concentration) estimates how concentrated hemoglobin is inside red cells.",
    whatItMeasures:
      "Hemoglobin concentration within red cells (g/dL). Marked changes can reflect artifact, spherocytosis, or severe iron issues — labs interpret carefully.",
    whyItMatters:
      "Low MCHC can accompany hypochromic anemias; high MCHC is less common and sometimes artifactual. Clinical labs use it as a quality and pattern clue.",
    understandingLevels:
      "Small deviations are common. Extreme values are more actionable than tiny shifts within or near the lab band.",
    influencingFactors: [
      "Iron deficiency and hemoglobin disorders",
      "Sample artifacts (lipemia, hemolysis)",
      "Hydration of red cells",
    ],
  }),

  rdw: base({
    summary:
      "RDW (red cell distribution width) describes how variable red blood cell sizes are.",
    whatItMeasures:
      "Variation in red-cell volume, reported as a percentage (or sometimes RDW-SD). Higher RDW means a wider mix of small and large cells.",
    whyItMatters:
      "Rising RDW can appear early in nutritional anemias, mixed deficiencies, or recovery after treatment. It is a clue, not a diagnosis.",
    understandingLevels:
      "High RDW with low MCV often pushes iron workup; high RDW with high MCV can prompt B12/folate review — patterns guide labs.",
    influencingFactors: [
      "Iron, B12, and folate status",
      "Recent transfusion or recovery from blood loss",
      "Chronic disease and inflammation",
    ],
    learnMore: [
      {
        label: "MedlinePlus — RDW",
        url: "https://medlineplus.gov/lab-tests/rdw-red-cell-distribution-width/",
      },
    ],
  }),

  pdw: base({
    summary:
      "PDW (platelet distribution width) describes variability in platelet size.",
    whatItMeasures:
      "How mixed large and small platelets are. Analyzer-specific reference intervals are common.",
    whyItMatters:
      "PDW is a supportive CBC index. Changes can accompany platelet activation or production shifts but are rarely interpreted alone.",
    understandingLevels:
      "Focus first on the platelet count and bleeding/clotting symptoms; PDW is secondary context.",
    influencingFactors: [
      "Platelet production and consumption",
      "Inflammation",
      "Analyzer method",
    ],
  }),

  esr: base({
    summary:
      "ESR (erythrocyte sedimentation rate) measures how quickly red cells settle in a tube — an older inflammation marker.",
    whatItMeasures:
      "Millimeters of red-cell fall in one hour. It rises nonspecifically with inflammation, infection, anemia, and age.",
    whyItMatters:
      "ESR is nonspecific. CRP is often preferred for acute inflammation, but ESR still appears on many panels and rheumatologic workups.",
    understandingLevels:
      "A mildly high ESR is common with aging or anemia. Very high values or values paired with symptoms need clinical correlation — not self-diagnosis.",
    influencingFactors: [
      "Age and sex",
      "Anemia and pregnancy",
      "Infection, autoimmune activity, and malignancy (clinical contexts)",
      "Technical factors in the assay",
    ],
    learnMore: [
      {
        label: "MedlinePlus — ESR",
        url: "https://medlineplus.gov/lab-tests/erythrocyte-sedimentation-rate-esr/",
      },
    ],
  }),

  "esr-2h": base({
    summary:
      "2nd-hour ESR extends the sedimentation observation to two hours on some European-style reports.",
    whatItMeasures:
      "Red-cell settling over a second hour. It is interpreted with the 1st-hour ESR, not instead of it.",
    whyItMatters:
      "Some labs historically reported both hours; modern practice often relies on 1st-hour ESR and/or CRP.",
    understandingLevels:
      "Treat 2nd-hour ESR as supportive context for the 1st-hour value and clinical picture.",
    influencingFactors: [
      "Same factors as 1st-hour ESR",
      "Lab method conventions",
    ],
  }),

  neutrophils: base({
    summary:
      "Neutrophils are the most abundant circulating white cells and first responders to bacterial infection.",
    whatItMeasures:
      "Neutrophil percentage of total WBC (absolute neutrophil count is often more informative when available).",
    whyItMatters:
      "Higher percentages can accompany infection, stress, smoking, or steroids. Lower percentages can accompany viral illness or medication effects.",
    understandingLevels:
      "Percentages shift when other white-cell lines change. Absolute counts (if on your report) are usually clearer than % alone.",
    influencingFactors: [
      "Infection and inflammation",
      "Corticosteroids and physiologic stress",
      "Medications affecting marrow",
      "Smoking",
    ],
  }),

  lymphocytes: base({
    summary:
      "Lymphocytes include T cells, B cells, and NK cells involved in adaptive and innate immunity.",
    whatItMeasures:
      "Lymphocyte percentage of WBC (absolute lymphocyte count preferred when available).",
    whyItMatters:
      "Lymphocyte % often rises relatively during viral recoveries or when neutrophils fall. Persistent lymphocytosis or lymphopenia needs clinical context.",
    understandingLevels:
      "A single differential % is a snapshot. Trends, symptoms, and absolute counts matter more than one percentage point.",
    influencingFactors: [
      "Viral infections and recovery",
      "Stress and corticosteroids",
      "Immune and marrow conditions (clinical contexts)",
      "Age",
    ],
  }),

  monocytes: base({
    summary:
      "Monocytes are circulating white cells that become macrophages in tissues.",
    whatItMeasures:
      "Monocyte percentage of WBC (or absolute monocyte count).",
    whyItMatters:
      "Mild monocyte rises can accompany chronic inflammation or recovery from infection. Marked or persistent elevations deserve clinical review.",
    understandingLevels:
      "Interpret with the full differential and clinical story — monocytes alone rarely define a condition.",
    influencingFactors: [
      "Chronic inflammation",
      "Recovery from acute illness",
      "Marrow and immune disorders (clinical contexts)",
    ],
  }),

  eosinophils: base({
    summary:
      "Eosinophils are white cells involved in allergic responses and defense against parasites.",
    whatItMeasures:
      "Eosinophil percentage of WBC (absolute eosinophil count preferred when available).",
    whyItMatters:
      "Higher eosinophils can accompany allergies, asthma, eczema, drug reactions, or parasitic infection. Mild elevations are common.",
    understandingLevels:
      "Correlate with allergy/asthma history and medications. Extreme elevations need clinician evaluation.",
    influencingFactors: [
      "Allergic disease",
      "Medications",
      "Parasitic infection (exposure-dependent)",
      "Some endocrine and immune conditions",
    ],
    learnMore: [
      {
        label: "MedlinePlus — Eosinophil count",
        url: "https://medlineplus.gov/lab-tests/eosinophil-count-blood/",
      },
    ],
  }),

  basophils: base({
    summary:
      "Basophils are the least abundant circulating white cells and participate in allergic inflammation.",
    whatItMeasures:
      "Basophil percentage of WBC. Because counts are tiny, percentages can look jumpy from draw to draw.",
    whyItMatters:
      "Isolated basophil changes are uncommon as a sole finding. They are interpreted with the rest of the differential and clinical context.",
    understandingLevels:
      "Small basophil % values near zero are typical. Focus on the broader CBC unless your clinician highlights this line.",
    influencingFactors: [
      "Allergic processes",
      "Assay precision at low counts",
      "Rare myeloproliferative contexts",
    ],
  }),

  bands: base({
    summary:
      "Band neutrophils are immature neutrophils sometimes reported on a manual differential.",
    whatItMeasures:
      "Percentage of bands among white cells. Many modern analyzers do not report bands the same way older manuals did.",
    whyItMatters:
      "Higher bands historically suggested acute bacterial stress (“left shift”), but practices vary widely by lab method.",
    understandingLevels:
      "Treat band % as method-dependent context for infection workups — not a standalone diagnosis.",
    influencingFactors: [
      "Acute infection or inflammation",
      "Lab counting method",
      "Stress responses",
    ],
  }),

  myelocytes: base({
    summary:
      "Myelocytes are immature myeloid cells that normally stay in bone marrow.",
    whatItMeasures:
      "Circulating myelocyte percentage on a differential. In healthy adults they are typically absent or vanishingly rare.",
    whyItMatters:
      "Finding myelocytes in peripheral blood can prompt clinicians to look for stress responses or marrow disorders — interpretation is highly clinical.",
    understandingLevels:
      "Any confirmed circulating myelocytes are worth discussing with the ordering clinician, especially if persistent.",
    influencingFactors: [
      "Severe stress or infection",
      "Marrow disorders (clinical contexts)",
      "Lab identification quality",
    ],
  }),

  metamyelocytes: base({
    summary:
      "Metamyelocytes are late immature neutrophils usually confined to marrow.",
    whatItMeasures:
      "Circulating metamyelocyte percentage. Healthy adults typically have none in peripheral blood.",
    whyItMatters:
      "Similar to myelocytes, circulating metamyelocytes can appear in intense stress or marrow pathology and need clinician review.",
    understandingLevels:
      "Discuss any reported metamyelocytes with your clinician rather than self-interpreting.",
    influencingFactors: [
      "Acute stress responses",
      "Marrow pathology (clinical contexts)",
      "Manual differential practice",
    ],
  }),

  "atypical-lymphs": base({
    summary:
      "Atypical (reactive) lymphocytes are activated lymphocytes often seen with viral illnesses.",
    whatItMeasures:
      "Percentage of atypical/reactive lymphocytes on a differential.",
    whyItMatters:
      "Small percentages can appear with viral infections such as mononucleosis-like illnesses. Persistent or high percentages need clinical correlation.",
    understandingLevels:
      "Atypical lymphs are a morphologic description, not a specific diagnosis. Pair with symptoms and viral testing when indicated.",
    influencingFactors: [
      "Viral infections",
      "Immune activation",
      "Reviewer/lab morphology criteria",
    ],
  }),

  "serum-iron": base({
    summary:
      "Serum iron is the iron circulating bound mainly to transferrin at the moment of the blood draw.",
    whatItMeasures:
      "Iron concentration in serum. It fluctuates through the day and with recent meals, so ferritin and transferrin/TIBC are usually more stable iron-status markers.",
    whyItMatters:
      "Low serum iron can accompany iron deficiency or inflammation; high values can follow supplementation or, less often, overload states. Timing matters.",
    understandingLevels:
      "Do not over-interpret serum iron alone — ferritin, transferrin saturation, and CBC indices complete the story.",
    influencingFactors: [
      "Time of day and recent iron intake",
      "Inflammation",
      "True iron stores",
      "Supplements",
    ],
    learnMore: [
      {
        label: "NHLBI — Iron-deficiency anemia",
        url: "https://www.nhlbi.nih.gov/health/anemia/iron-deficiency-anemia",
      },
    ],
  }),

  transferrin: base({
    summary:
      "Transferrin is the main iron-transport protein in blood.",
    whatItMeasures:
      "Transferrin concentration (some labs report TIBC instead, which is closely related).",
    whyItMatters:
      "Transferrin often rises in iron deficiency and falls with inflammation or malnutrition. It helps distinguish iron patterns when paired with ferritin and serum iron.",
    understandingLevels:
      "Mayo TRSF grades 200-360 mg/dL as the lab interval (attention / good / attention at those ends). Quest 891 prints 188-341 mg/dL; that disagreement is not a separate fair band. There is no sourced interior optimum.",
    influencingFactors: [
      "Iron stores",
      "Inflammation",
      "Liver synthetic function and nutrition",
      "Estrogen/pregnancy (when relevant)",
    ],
  }),

  ferritin: base({
    summary:
      "Ferritin reflects stored iron and is the most used blood marker of iron reserves.",
    whatItMeasures:
      "Ferritin concentration. It also rises as an acute-phase reactant during inflammation, so high ferritin is not always iron overload.",
    whyItMatters:
      "Low ferritin is the most specific common blood clue to low iron stores. High ferritin can reflect overload, liver disease, alcohol, or inflammation.",
    understandingLevels:
      "Interpret ferritin with CBC, CRP (inflammation), and transferrin saturation. Women of reproductive age often run lower ferritin than men.",
    ifLower: [
      "Discuss dietary iron sources and whether testing for blood loss is appropriate",
      "Do not start high-dose iron without clinician guidance if the cause is unclear",
    ],
    ifHigher: [
      "Review alcohol intake, supplements, and inflammatory conditions",
      "Ask whether transferrin saturation or further iron studies are needed",
    ],
    influencingFactors: [
      "Iron stores and menstrual blood loss",
      "Inflammation and infection",
      "Liver disease and alcohol",
      "Supplementation and rare genetic overload syndromes",
    ],
    learnMore: [
      {
        label: "MedlinePlus — Ferritin",
        url: "https://medlineplus.gov/lab-tests/ferritin-blood-test/",
      },
    ],
  }),

  folate: base({
    summary:
      "Folate (vitamin B9) is required for DNA synthesis and red blood cell production.",
    whatItMeasures:
      "Serum folate (or sometimes RBC folate). Serum folate reflects recent intake; deficiency cutoffs vary by lab.",
    whyItMatters:
      "Low folate can contribute to megaloblastic anemia and is important in pregnancy planning. Alcohol and some medications affect status.",
    understandingLevels:
      "Low values prompt dietary review and consideration of B12 status (the two can look similar on CBC). High values usually reflect supplementation.",
    ifLower: [
      "Increase leafy greens, legumes, and fortified foods",
      "Discuss alcohol use and medications with a clinician",
    ],
    influencingFactors: [
      "Dietary intake and absorption",
      "Alcohol use",
      "Pregnancy and increased demand",
      "Medications affecting folate metabolism",
    ],
    learnMore: [
      {
        label: "NIH ODS — Folate",
        url: "https://ods.od.nih.gov/factsheets/Folate-Consumer/",
      },
    ],
  }),

  "vitamin-b12": base({
    summary:
      "Vitamin B12 is essential for nerve function and healthy red blood cell formation.",
    whatItMeasures:
      "Serum B12 concentration. Borderline-low levels may still be clinically relevant; MMA/homocysteine can help when results are unclear.",
    whyItMatters:
      "Low B12 can relate to absorption issues (including low intrinsic factor), vegan diets without supplementation, or certain medications such as metformin or acid suppressants.",
    understandingLevels:
      "Symptoms like numbness, balance changes, or glossitis deserve attention even if B12 is only “low-normal.” Do not self-supplement high doses without a plan if neurologic symptoms exist — get evaluated.",
    ifLower: [
      "Review diet (animal products or fortified foods) and absorption risk factors",
      "Ask about MMA testing if levels are borderline",
    ],
    influencingFactors: [
      "Dietary intake",
      "Stomach/ileum absorption",
      "Metformin and acid-suppressing drugs",
      "Age-related absorption changes",
    ],
    learnMore: [
      {
        label: "NIH ODS — Vitamin B12",
        url: "https://ods.od.nih.gov/factsheets/VitaminB12-Consumer/",
      },
    ],
  }),

  "vitamin-d": base({
    summary:
      "25-hydroxyvitamin D is the standard blood marker of vitamin D stores from sun and diet.",
    whatItMeasures:
      "Total 25(OH)D. It is not the active hormone (1,25-dihydroxyvitamin D), which is regulated differently.",
    whyItMatters:
      "Low 25(OH)D is common and associated with bone health risk; extreme elevations usually reflect excessive supplementation. Optimal targets are debated across societies.",
    understandingLevels:
      "Many labs flag <20 ng/mL as deficient and 20–30 as insufficient, while some endocrinology guidance uses different cut points. Season, latitude, skin pigmentation, and BMI all shift levels.",
    ifLower: [
      "Discuss safe sun habits, diet (fatty fish, fortified foods), and whether supplementation is appropriate",
      "Recheck after a clinician-guided course rather than endless megadosing",
    ],
    ifHigher: [
      "Review supplement dose with a clinician — more is not always better",
    ],
    influencingFactors: [
      "Sun exposure and season",
      "Skin pigmentation and latitude",
      "Body weight and absorption",
      "Supplement dose",
    ],
    learnMore: [
      {
        label: "NIH ODS — Vitamin D",
        url: "https://ods.od.nih.gov/factsheets/VitaminD-Consumer/",
      },
      {
        label: "Endocrine Society vitamin D resources",
        url: "https://www.endocrine.org/patient-engagement/endocrine-library/vitamin-d-deficiency",
      },
    ],
  }),

  crp: base({
    summary:
      "CRP (C-reactive protein) is a liver-made protein that rises quickly with inflammation.",
    whatItMeasures:
      "CRP or high-sensitivity CRP (hs-CRP). Standard CRP tracks acute inflammation; hs-CRP can also be used in some cardiovascular risk discussions.",
    whyItMatters:
      "CRP is nonspecific — infection, injury, autoimmune flares, and metabolic inflammation can all raise it. Trends and symptoms matter more than a single mild bump.",
    understandingLevels:
      "Very high CRP often accompanies acute illness. Mild chronic elevations can relate to adiposity and lifestyle factors. This marker does not identify a specific disease by itself.",
    ifHigher: [
      "Address sleep, physical activity, and smoking cessation",
      "Treat obvious infections with clinician guidance",
      "Discuss whether hs-CRP vs standard CRP was ordered",
    ],
    influencingFactors: [
      "Infection and tissue injury",
      "Autoimmune activity",
      "Adiposity and metabolic inflammation",
      "Smoking",
    ],
    learnMore: [
      {
        label: "MedlinePlus — CRP",
        url: "https://medlineplus.gov/lab-tests/c-reactive-protein-crp-test/",
      },
    ],
  }),

  tsh: base({
    summary:
      "TSH (thyroid-stimulating hormone) is the pituitary signal that tells the thyroid how hard to work.",
    whatItMeasures:
      "Circulating TSH. It is usually the first-line thyroid screening test; free T4 (and sometimes free T3) complete the picture.",
    whyItMatters:
      "High TSH can suggest an underactive thyroid pattern; low TSH can suggest an overactive pattern or suppression — but pregnancy, illness, and medications change targets.",
    understandingLevels:
      "Mild TSH shifts are common and often rechecked before treatment decisions. Symptoms, antibodies, and free T4 guide next steps — TSH alone is not a full diagnosis.",
    ifHigher: [
      "Note fatigue, cold intolerance, weight change, or constipation for your clinician",
      "Ask whether free T4 and thyroid antibodies are useful next",
    ],
    ifLower: [
      "Note palpitations, heat intolerance, anxiety, or weight loss for your clinician",
      "Review biotin supplements (can interfere with some assays) and confirm fasting/timing if advised",
    ],
    influencingFactors: [
      "Autoimmune thyroid disease",
      "Iodine intake and medications (e.g. amiodarone, lithium)",
      "Pregnancy and acute illness",
      "Biotin interference with some immunoassays",
    ],
    learnMore: [
      {
        label: "American Thyroid Association — Thyroid function tests",
        url: "https://www.thyroid.org/thyroid-function-tests/",
      },
    ],
  }),

  cortisol: base({
    summary:
      "Cortisol is a hormone from the adrenal glands that helps regulate stress responses, metabolism, blood pressure, and immune tone.",
    whatItMeasures:
      "Blood cortisol at a single time point. Cortisol follows a diurnal rhythm — highest in the early morning after waking, then falling through the day — so the clock time of the draw matters enormously.",
    whyItMatters:
      "Higher morning cortisol can relate to physiologic stress, poor sleep, caffeine, illness, or, less commonly, cortisol excess disorders. Lower morning cortisol can relate to adrenal insufficiency patterns or assay/timing issues. This app cannot diagnose Cushing’s syndrome, Addison’s disease, or related conditions.",
    understandingLevels:
      "Lab ranges are usually for a stated time window (often morning). Optimization bands on educational apps are tighter lifestyle targets inside the lab interval — they are not diagnostic thresholds. Morning values under very low cutoffs or repeatedly high values outside the lab range deserve clinician review, especially with symptoms.",
    ifHigher: [
      "Protect 7–9 hours of sleep; reduce late caffeine and evening screens",
      "Use daylight exposure, walks, and evidence-based stress practices (breath work, yoga, therapy as appropriate)",
      "Discuss medications (including steroids) that alter cortisol",
    ],
    ifLower: [
      "Confirm draw timing and whether you take steroid medicines",
      "Seek prompt care for dizziness, fainting, severe fatigue, or illness with low cortisol — do not self-treat",
    ],
    influencingFactors: [
      "Time of day and sleep schedule",
      "Acute and chronic stress, illness, and overtraining",
      "Caffeine, alcohol, and smoking",
      "Oral estrogen, inhaled/topical/oral steroids, and assay type",
      "Shift work and jet lag",
    ],
    learnMore: [
      {
        label: "Cleveland Clinic — Cortisol",
        url: "https://my.clevelandclinic.org/health/articles/22187-cortisol",
      },
      {
        label: "Endocrine Society — Cushing’s syndrome (patient)",
        url: "https://www.endocrine.org/patient-engagement/endocrine-library/cushings-syndrome",
      },
      {
        label: "NIDDK — Adrenal insufficiency",
        url: "https://www.niddk.nih.gov/health-information/endocrine-diseases/adrenal-insufficiency-addisons-disease",
      },
    ],
    discussWithClinician:
      "Cortisol must be read with draw time, symptoms, and sometimes repeat or saliva/urine testing. If you are concerned about adrenal or pituitary disease, see a clinician promptly — do not change steroid medicines on your own.",
  }),

  homocysteine: base({
    summary:
      "Homocysteine is an amino acid intermediate in methionine metabolism, influenced by B vitamins.",
    whatItMeasures:
      "Plasma/serum homocysteine. Levels rise when folate, B12, or B6 pathways are insufficient or when kidney function is reduced.",
    whyItMatters:
      "Higher homocysteine has been associated with vascular risk in observational studies. Lowering it with vitamins does not always improve hard outcomes, so clinicians individualize whether to act on it.",
    understandingLevels:
      "Mild elevations often prompt a look at B12/folate status and kidney function. Very high values are less common and need medical evaluation.",
    ifHigher: [
      "Ensure adequate folate, B12, and B6 intake from food or clinician-guided supplements",
      "Review kidney function and medications",
    ],
    influencingFactors: [
      "Folate, B12, and B6 status",
      "Kidney function",
      "Genetics (e.g. MTHFR variants — clinical interpretation varies)",
      "Age and sex",
    ],
    learnMore: [
      {
        label: "MedlinePlus — Homocysteine",
        url: "https://medlineplus.gov/lab-tests/homocysteine-test/",
      },
    ],
  }),

  "apo-b": base({
    summary:
      "ApoB (apolipoprotein B) is the main structural protein on atherogenic lipoproteins. Each VLDL, IDL, LDL, and Lp(a) particle carries one ApoB molecule, so the blood level is a count of those particles rather than the cholesterol they happen to be carrying.",
    whatItMeasures:
      "Serum ApoB concentration, usually in mg/dL. Routine assays do not separate ApoB-100 from ApoB-48; after an overnight fast, nearly all of the measured ApoB is ApoB-100.",
    whyItMatters:
      "LDL cholesterol measures how much cholesterol is packed into particles; ApoB measures how many particles there are. Expert consensus and several studies have found that when those two numbers disagree, long-term atherosclerotic event risk tends to follow ApoB more closely than LDL-C. That is an association used for risk discussion — not a diagnosis of heart disease from a single result.",
    understandingLevels:
      "Lab catalogs often call <90 mg/dL “desirable.” The 2024 National Lipid Association expert consensus instead suggests ApoB intensification thresholds of 60, 70, and 90 mg/dL for very-high, high, and borderline-to-intermediate ASCVD risk — those are risk-category treatment prompts, not a single healthy-adult target. Unusually low values are uncommon; this app does not treat “lower is always better” as a clinical rule.",
    ifHigher: [
      "Emphasize fiber-rich foods, unsaturated fats, and overall calorie balance",
      "Stay physically active most days of the week and avoid tobacco",
      "Review the rest of the lipid panel (LDL, non-HDL, triglycerides, Lp(a)) with a clinician",
    ],
    ifLower: [
      "Very low ApoB is uncommon on an optimization panel — share it with a clinician rather than trying to raise it on your own",
    ],
    influencingFactors: [
      "Dietary saturated fat, refined carbohydrates, and overall energy balance",
      "Physical activity, body composition, and not smoking",
      "Genetics and family history of high cholesterol",
      "Lipid-lowering therapy, if prescribed",
      "Metabolic context such as triglycerides, insulin resistance, and thyroid status",
    ],
    learnMore: [
      {
        label:
          "NLA 2024 — Role of apolipoprotein B in clinical management of cardiovascular risk (Expert Clinical Consensus)",
        url: "https://www.lipidjournal.com/article/S1933-2874(24)00240-X/fulltext",
      },
      {
        label:
          "Behbodikhah et al. 2021 — Apolipoprotein B and cardiovascular disease (review)",
        url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8540246/",
      },
      {
        label:
          "Marston et al. 2022 — ApoB-containing lipoproteins and myocardial infarction (JAMA Cardiology)",
        url: "https://doi.org/10.1001/jamacardio.2021.5083",
      },
      {
        label: "Cleveland Clinic — ApoB test",
        url: "https://my.clevelandclinic.org/health/diagnostics/24992-apolipoprotein-b-test",
      },
    ],
    discussWithClinician:
      "Ask how this ApoB result sits next to LDL, non-HDL, triglycerides, and your overall cardiovascular risk. Thresholds for considering treatment differ by risk category — this app does not assign you one.",
  }),

  "apo-a1": base({
    summary:
      "ApoA1 is the main protein on HDL particles and is involved in moving cholesterol back toward the liver.",
    whatItMeasures:
      "The concentration of apolipoprotein A1 in serum. It is related to HDL but is not a 1:1 stand-in for HDL cholesterol.",
    whyItMatters:
      "Lower ApoA1 is commonly linked with higher atherosclerotic risk in population studies. Clinicians often look at it together with ApoB rather than in isolation.",
    understandingLevels:
      "Adult lab catalogs typically flag low ApoA1; there is no widely agreed “higher is always better” ceiling. Compare with HDL, ApoB, and overall risk — not as a diagnosis.",
    ifLower: [
      "Increase aerobic activity and avoid smoking",
      "Review the rest of the lipid panel with a clinician",
    ],
    influencingFactors: [
      "Aerobic activity and smoking status",
      "Genetics",
      "The rest of the lipid panel (HDL, ApoB, triglycerides)",
    ],
    learnMore: [
      {
        label: "Mayo Clinic Laboratories — ApoA1",
        url: "https://www.mayocliniclabs.com/test-catalog/overview/607591",
      },
    ],
  }),

  "apo-b-apo-a1-ratio": base({
    summary:
      "The ApoB:ApoA1 ratio is ApoB divided by ApoA1. It condenses the balance between ApoB-containing (atherogenic) particles and ApoA1, the main protein on HDL.",
    whatItMeasures:
      "A calculated mass ratio from the two protein results (units cancel). Labs that report both ApoB and ApoA1 can print this number; it is not a separate chemical assay.",
    whyItMatters:
      "In the INTERHEART case-control study across 52 countries, ApoB:ApoA1 was more strongly associated with a first myocardial infarction than several cholesterol-based ratios. That is a population association used for risk discussion — not a diagnosis of heart disease from one number.",
    understandingLevels:
      "Mayo Clinic Laboratories (APOAB) uses sex-specific catalogs: adult men lower risk <0.7, average 0.7–0.9, higher risk >0.9; adult women lower risk <0.6, average 0.6–0.8, higher risk >0.8. Lower values sit on the more favorable side of those tiers. This app does not assign you a cardiovascular-risk category.",
    ifHigher: [
      "Emphasize fiber-rich foods, unsaturated fats, and overall calorie balance",
      "Stay physically active most days of the week and avoid tobacco",
      "Review ApoB, ApoA1, LDL, HDL, and triglycerides together with a clinician",
    ],
    ifLower: [
      "An unusually low ratio is not something to try to raise on your own — share unexpected results with a clinician",
    ],
    influencingFactors: [
      "The separate ApoB and ApoA1 concentrations (either can move the ratio)",
      "Dietary saturated fat, refined carbohydrates, and overall energy balance",
      "Physical activity, body composition, and not smoking",
      "Genetics and lipid-lowering therapy, if prescribed",
    ],
    learnMore: [
      {
        label: "Mayo Clinic Laboratories — Apolipoprotein A1 and B (APOAB)",
        url: "https://www.mayocliniclabs.com/test-catalog/Overview/607593",
      },
      {
        label:
          "McQueen et al. 2008 — INTERHEART lipids, lipoproteins, and apolipoproteins (Lancet)",
        url: "https://doi.org/10.1016/S0140-6736(08)61076-4",
      },
    ],
    discussWithClinician:
      "Ask how this ratio sits next to ApoB, ApoA1, LDL, HDL, and your overall cardiovascular risk. Catalog tiers are not a personal risk score.",
  }),

  "c-peptide": base({
    summary:
      "C-peptide is released when the pancreas makes insulin, so it reflects endogenous insulin production.",
    whatItMeasures:
      "Connecting peptide of proinsulin, usually after an overnight fast. It stays in the blood longer than insulin itself.",
    whyItMatters:
      "Clinicians use it when they need to tell apart insulin the body made versus insulin that was injected, and to gauge remaining insulin production.",
    understandingLevels:
      "Fasting values are interpreted with glucose, insulin, and clinical context. This app does not diagnose diabetes or hypoglycemia.",
    influencingFactors: [
      "Fasting vs fed state",
      "Kidney function (C-peptide is cleared by the kidneys)",
      "Insulin production and insulin resistance",
    ],
    learnMore: [
      {
        label: "Mayo Clinic Laboratories — C-Peptide",
        url: "https://www.mayocliniclabs.com/test-catalog/overview/8804/c-peptide-serum",
      },
    ],
  }),

  "iron-saturation": base({
    summary:
      "Iron saturation (transferrin saturation) is serum iron divided by total iron-binding capacity.",
    whatItMeasures:
      "The share of transferrin that is occupied by iron at the time of the draw. It varies through the day and after meals.",
    whyItMatters:
      "Low saturation is used when screening for iron deficiency; high saturation is used when looking for iron overload, always alongside ferritin.",
    understandingLevels:
      "A single saturation value is noisy. Ferritin plus this number is more informative than either alone.",
    influencingFactors: [
      "Time of day and recent meals",
      "Inflammation",
      "Iron stores, bleeding, and supplementation",
    ],
    learnMore: [
      {
        label: "Mayo Clinic Laboratories — Percent Saturation",
        url: "https://www.mayocliniclabs.com/test-catalog/overview/2503",
      },
    ],
  }),

  "vldl-cholesterol": base({
    summary:
      "VLDL carries triglycerides from the liver. Many labs calculate it from triglycerides rather than measuring it directly.",
    whatItMeasures:
      "Cholesterol on very-low-density lipoprotein particles, often estimated as triglycerides ÷ 5 in mg/dL units.",
    whyItMatters:
      "It moves with triglycerides. The triglyceride result is usually the more useful number for discussion with a clinician.",
    understandingLevels:
      "Quest 319 (and Mayo LMPP) flag calculated VLDL cholesterol at <30 mg/dL. This catalog grades <30 as good and ≥30 as attention. No interior optimum is claimed.",
    learnMore: [
      {
        label: "Quest Diagnostics — VLDL Cholesterol (319)",
        url: "https://testdirectory.questdiagnostics.com/test/test-detail/319/vldl-cholesterol?p=r&cc=MASTER",
      },
    ],
    influencingFactors: ["Recent meals", "Triglyceride level", "Alcohol and refined carbohydrate intake"],
  }),

  "bilirubin-direct": base({
    summary:
      "Direct (conjugated) bilirubin is the form processed by the liver for excretion.",
    whatItMeasures:
      "Conjugated bilirubin in serum, distinct from total bilirubin which also includes the unconjugated fraction.",
    whyItMatters:
      "Clinicians compare direct and total bilirubin when looking at liver and bile-duct patterns — this app does not diagnose those conditions.",
    understandingLevels:
      "Mayo grades adults at 0.0-0.3 mg/dL (good through the lab high, attention above). There is no sourced interior optimum.",
    influencingFactors: ["Liver processing of bilirubin", "Bile-duct flow", "Assay method"],
  }),

  "total-protein": base({
    summary:
      "Total protein is the combined concentration of albumin and globulins in serum.",
    whatItMeasures:
      "Overall protein in the liquid part of blood. Albumin is usually interpreted alongside it.",
    whyItMatters:
      "It is a broad chemistry marker. Low or high values have many possible explanations and need the rest of the panel.",
    understandingLevels:
      "Mayo grades ages >=1 year at 6.3-7.9 g/dL. Values inside that interval cap at good; there is no sourced interior optimum.",
    influencingFactors: ["Hydration", "Liver protein production", "Inflammation and immune proteins"],
  }),

  uibc: base({
    summary:
      "UIBC is the leftover iron-binding capacity of transferrin that is not already occupied by iron.",
    whatItMeasures:
      "Unsaturated iron-binding capacity. TIBC is typically serum iron plus UIBC.",
    whyItMatters:
      "It is part of the same iron-status set as serum iron, TIBC, saturation, and ferritin.",
    understandingLevels:
      "Labcorp’s adult table (ages 18–60) grades men at 111-343 ug/dL and women at 131-425 ug/dL (attention / good / attention). This product does not grade UIBC after age 60 — that table stops there.",
    learnMore: [
      {
        label: "Labcorp — Pediatric Testing Reference Ranges (UIBC table)",
        url: "https://www.labcorp.com/content/dam/labcorp/drupal/178250_DX_TL_PediatricTestRef_Final.pdf",
      },
    ],
    influencingFactors: ["Iron stores", "Inflammation", "The paired serum-iron result"],
  }),

  tpoab: base({
    summary:
      "TPO antibodies are immune proteins directed at thyroperoxidase, an enzyme in the thyroid.",
    whatItMeasures:
      "Thyroperoxidase antibody concentration. Cutoffs differ by assay, so the number is not interchangeable across labs.",
    whyItMatters:
      "Detectable TPO antibodies are commonly discussed in autoimmune thyroid conditions. This app does not diagnose thyroid disease.",
    understandingLevels:
      "Mayo's Access TPO assay flags values at or above 9.0 IU/mL. Antibody cutoffs do not transfer across methods — if your lab used a different assay, prefer the printed interval.",
    influencingFactors: ["Assay method", "Autoimmune thyroid conditions", "Other autoimmune diseases"],
  }),

  tgab: base({
    summary:
      "Thyroglobulin antibodies are immune proteins directed at thyroglobulin.",
    whatItMeasures:
      "Thyroglobulin antibody concentration. Like TPO antibodies, cutoffs depend on the assay.",
    whyItMatters:
      "They are sometimes measured with TPO antibodies in thyroid autoimmunity workups.",
    understandingLevels:
      "The Mayo thyroid-autoantibody profile flags thyroglobulin antibody at or above 4.0 IU/mL. Other Mayo TgAb methods use a different cutoff — prefer the printed interval when the assay is not this one.",
    influencingFactors: ["Assay method", "Thyroid autoimmunity", "Prior thyroid surgery or radioiodine in some contexts"],
  }),

  hba1c: base({
    summary:
      "HbA1c (A1C) estimates average blood glucose over roughly the past 2–3 months.",
    whatItMeasures:
      "The percentage of hemoglobin with glucose attached. It does not require fasting, unlike a glucose draw.",
    whyItMatters:
      "ADA diagnostic categories use A1C alongside fasting glucose. It is a screening and monitoring tool — not a diagnosis from this app.",
    understandingLevels:
      "This catalog maps Mayo’s 4.0–5.6% reference with ADA’s 5.7–6.4% increased-risk and ≥6.5% diabetes cutpoints. Personal targets after a diabetes diagnosis are a separate clinical conversation.",
    ifHigher: [
      "Favor protein, fiber, and walking after meals",
      "Keep sugary drinks for rare occasions",
      "Review medications, illness, and fasting glucose with a clinician",
    ],
    influencingFactors: [
      "Average glucose over weeks",
      "Anemia, hemoglobin variants, and kidney disease (can shift A1C)",
      "Recent blood loss or transfusion",
    ],
    learnMore: [
      {
        label: "ADA — Diagnosis and Classification of Diabetes",
        url: "https://diabetesjournals.org/care/article/49/Supplement_1/S27/163926/2-Diagnosis-and-Classification-of-Diabetes",
      },
    ],
  }),

  eag: base({
    summary:
      "Estimated average glucose (eAG) restates your A1C as a glucose number in mg/dL.",
    whatItMeasures:
      "A calculated value using the ADA/ADAG formula: eAG (mg/dL) = 28.7 × A1C − 46.7. It is not a separate lab assay.",
    whyItMatters:
      "Some people find mg/dL easier to compare with home glucose readings. The underlying information is still the A1C.",
    understandingLevels:
      "Bands here are that formula applied to this catalog’s A1C cutpoints (about 68–114 mg/dL for A1C 4.0–5.6, then higher bands matching ADA 5.7–6.4 and ≥6.5). Prefer the A1C itself if the two disagree because of rounding.",
    influencingFactors: [
      "The paired HbA1c result",
      "Anything that shifts A1C (anemia, variants, kidney disease)",
    ],
    learnMore: [
      {
        label: "ADA — eAG/A1C conversion calculator",
        url: "https://professional.diabetes.org/glucose_calc",
      },
    ],
  }),

  insulin: base({
    summary:
      "Fasting insulin is the amount of insulin in blood after not eating for several hours.",
    whatItMeasures:
      "Circulating insulin, usually after an 8-hour fast. It is interpreted with glucose, not alone.",
    whyItMatters:
      "Insulin and glucose together help clinicians think about insulin production and insulin resistance. This app does not diagnose those states.",
    understandingLevels:
      "Mayo’s fasting interval is 2.6–24.9 µIU/mL. Values inside that window cap at good; there is no sourced interior optimum or HOMA-IR cutoff here.",
    influencingFactors: [
      "Fasting vs fed state",
      "Body composition and carbohydrate pattern",
      "The paired glucose result",
    ],
  }),

  egfr: base({
    summary:
      "eGFR estimates how well the kidneys filter blood, derived from creatinine (and sometimes cystatin C), age, and sex.",
    whatItMeasures:
      "A calculated filtration rate in mL/min/1.73 m², not a chemical you can measure directly in the tube.",
    whyItMatters:
      "KDIGO uses eGFR categories when discussing chronic kidney disease staging. A single value needs confirmation and clinical context.",
    understandingLevels:
      "This catalog maps KDIGO G1–G5 onto optimization bands (≥90 optimal, 60–89 good, 30–59 fair, <30 attention). Muscle mass, diet, and assay method shift creatinine and therefore eGFR.",
    ifLower: [
      "Discuss blood pressure, hydration, and medications that affect the kidney with a clinician",
      "Avoid assuming one low result is a diagnosis",
    ],
    influencingFactors: [
      "Creatinine (muscle mass, diet, assay)",
      "Age and sex in the equation",
      "Acute illness and hydration",
    ],
    learnMore: [
      {
        label: "KDIGO — CKD evaluation and management",
        url: "https://kdigo.org/guidelines/ckd-evaluation-and-management/",
      },
    ],
  }),

  alp: base({
    summary:
      "Alkaline phosphatase (ALP) is an enzyme from bone, liver, and other tissues.",
    whatItMeasures:
      "ALP activity in serum. Isoenzyme tests can tell bone from liver sources when needed.",
    whyItMatters:
      "Clinicians look at ALP with GGT, bilirubin, and calcium/phosphate when the result is unexpected.",
    understandingLevels:
      "Mayo publishes sex-specific adult intervals. Inside the interval the grade caps at good; there is no sourced interior optimum.",
    influencingFactors: [
      "Liver and bile-duct flow",
      "Bone turnover (growth, fracture, vitamin D)",
      "Pregnancy (placental ALP)",
    ],
  }),

  "bilirubin-total": base({
    summary:
      "Total bilirubin is the sum of unconjugated and conjugated bilirubin in serum.",
    whatItMeasures:
      "A pigment from heme breakdown. Direct (conjugated) bilirubin is the processed fraction.",
    whyItMatters:
      "It is used with liver enzymes when looking at liver and red-cell turnover patterns — not as a standalone diagnosis.",
    understandingLevels:
      "Mayo grades adults on a reference interval. Gilbert syndrome and fasting can raise unconjugated bilirubin in otherwise well people.",
    influencingFactors: [
      "Liver processing and bile flow",
      "Hemolysis and fasting",
      "Inherited conjugation differences (e.g. Gilbert)",
    ],
  }),

  albumin: base({
    summary:
      "Albumin is the main protein made by the liver that circulates in blood.",
    whatItMeasures:
      "Serum albumin concentration. It also helps carry hormones, calcium, and drugs.",
    whyItMatters:
      "Low albumin has many causes (inflammation, nutrition, liver, kidney losses). High albumin often reflects dehydration.",
    understandingLevels:
      "Mayo grades ages ≥1 year on a reference interval. Inside that window the grade caps at good.",
    influencingFactors: [
      "Hydration",
      "Inflammation and nutrition",
      "Liver production and kidney/gut losses",
    ],
  }),

  tibc: base({
    summary:
      "TIBC is the blood’s total capacity to bind iron, mostly reflecting transferrin.",
    whatItMeasures:
      "Total iron-binding capacity, typically serum iron plus UIBC, or derived from transferrin.",
    whyItMatters:
      "It is part of the iron-status set with ferritin, serum iron, and saturation.",
    understandingLevels:
      "Mayo publishes an adult interval. TIBC often moves opposite to iron stores, but inflammation blunts that pattern.",
    influencingFactors: [
      "Iron stores",
      "Inflammation",
      "The paired serum-iron and ferritin results",
    ],
  }),

  "omega-3-index": base({
    summary:
      "The omega-3 index is the share of EPA plus DHA in red-cell membranes.",
    whatItMeasures:
      "A percentage of erythrocyte fatty acids, not a plasma triglyceride number.",
    whyItMatters:
      "Harris & von Schacky’s proposed risk zones use ≤4% / 4–8% / ≥8%. Those are research cutpoints, not a disease diagnosis.",
    understandingLevels:
      "This catalog maps those published tiers onto attention / fair / optimal. Diet and supplements change the index over weeks to months.",
    ifLower: [
      "Discuss oily fish intake and whether an omega-3 supplement is appropriate with a clinician",
    ],
    influencingFactors: [
      "EPA/DHA intake from fish or supplements",
      "Time since last dose",
      "Assay method",
    ],
  }),

  "free-t4": base({
    summary:
      "Free T4 is the unbound thyroxine available to tissues.",
    whatItMeasures:
      "The free fraction of T4, usually interpreted with TSH (and sometimes free T3).",
    whyItMatters:
      "TSH plus free T4 is the usual starting pair for thyroid status. This app does not diagnose hypo- or hyperthyroidism.",
    understandingLevels:
      "Mayo publishes an adult reference interval. Values inside cap at good; pregnancy and biotin can shift the number.",
    influencingFactors: [
      "TSH and pituitary signaling",
      "Biotin supplements (assay interference)",
      "Pregnancy and binding-protein changes",
    ],
  }),

  "free-t3": base({
    summary:
      "Free T3 is the unbound triiodothyronine, the more active thyroid hormone.",
    whatItMeasures:
      "Free T3 concentration. It is not always needed when TSH and free T4 already answer the question.",
    whyItMatters:
      "Clinicians sometimes add it when TSH and free T4 are discordant. Isolated free T3 changes have many non-thyroid causes.",
    understandingLevels:
      "Mayo publishes an adult interval. Inside that window the grade caps at good.",
    influencingFactors: [
      "Conversion of T4 to T3",
      "Illness (non-thyroidal illness can lower T3)",
      "Assay method and biotin",
    ],
  }),

  testosterone: base({
    summary:
      "Total testosterone is testosterone bound to proteins plus the unbound fraction.",
    whatItMeasures:
      "Circulating testosterone, preferably a morning draw. Sex- and age-specific intervals differ widely.",
    whyItMatters:
      "It is interpreted with SHBG, free testosterone, symptoms, and (when relevant) menstrual or fertility history. This app does not diagnose hypogonadism or PCOS.",
    understandingLevels:
      "Mayo publishes sex-specific adult intervals. Female cycle-independent totals are still a snapshot. Morning timing matters more in men.",
    influencingFactors: [
      "Time of day (higher in the morning for many men)",
      "SHBG, body composition, and sleep",
      "Medications and acute illness",
    ],
  }),

  "free-testosterone": base({
    summary:
      "Free testosterone is the fraction not bound to SHBG or albumin.",
    whatItMeasures:
      "Unbound testosterone, by calculation or by a direct method such as equilibrium dialysis. Methods are not interchangeable.",
    whyItMatters:
      "When SHBG is unusual, free testosterone can tell a different story than the total. It is still not a diagnosis on its own.",
    understandingLevels:
      "Mayo TGRP (equilibrium dialysis) uses age-banded male intervals and female high-side limits. Prefer the printed method if your lab did not use dialysis.",
    influencingFactors: [
      "SHBG and albumin",
      "Time of day and assay method",
      "The paired total testosterone",
    ],
  }),

  shbg: base({
    summary:
      "SHBG is the protein that binds sex hormones (testosterone and estradiol) in blood.",
    whatItMeasures:
      "Sex hormone-binding globulin concentration, which changes how much hormone is free versus bound.",
    whyItMatters:
      "High or low SHBG shifts free hormone without necessarily changing production. Insulin, thyroid status, and estrogen all influence SHBG.",
    understandingLevels:
      "Mayo publishes sex-specific adult intervals. Inside the interval the grade caps at good.",
    influencingFactors: [
      "Insulin and body composition",
      "Thyroid and estrogen status",
      "Age and liver protein production",
    ],
  }),

  estradiol: base({
    summary:
      "Estradiol is the main estrogen circulating in blood.",
    whatItMeasures:
      "17β-estradiol, usually by immunoassay or mass spectrometry. Female values swing widely across the menstrual cycle.",
    whyItMatters:
      "It is interpreted with cycle day, menopausal status, and (in men) testosterone. This app does not diagnose menopause, PCOS, or estrogen excess.",
    understandingLevels:
      "Adult men are graded on Mayo EEST 10–40 pg/mL. Female rows are not graded here because Mayo’s intervals need cycle phase or menopausal status, which this product does not collect.",
    influencingFactors: [
      "Cycle day and menopausal status",
      "Body composition and aromatase activity",
      "Assay method (immunoassay vs mass spec)",
    ],
  }),

  "dhea-s": base({
    summary:
      "DHEA-S is a long-lived adrenal androgen stored as a sulfate.",
    whatItMeasures:
      "Dehydroepiandrosterone sulfate. It varies with age and is more stable through the day than cortisol.",
    whyItMatters:
      "Clinicians use it in some adrenal and androgen workups. This app does not diagnose adrenal disease.",
    understandingLevels:
      "Mayo publishes age- and sex-banded adult intervals. Inside the interval the grade caps at good.",
    influencingFactors: [
      "Age (generally declines in adulthood)",
      "Adrenal output and some medications",
      "Assay method",
    ],
  }),

  fsh: base({
    summary:
      "FSH is a pituitary hormone that signals the ovaries or testes.",
    whatItMeasures:
      "Follicle-stimulating hormone. Female values spike at midcycle and rise after menopause.",
    whyItMatters:
      "It is used with estradiol, LH, and clinical context for fertility and menopausal questions — not as a standalone diagnosis here.",
    understandingLevels:
      "Adult men are graded on Mayo’s male interval. Female rows are not graded without cycle day or menopausal status.",
    influencingFactors: [
      "Cycle phase and menopausal status",
      "Pituitary and gonadal feedback",
      "Assay method",
    ],
  }),

  lh: base({
    summary:
      "LH is a pituitary hormone that triggers ovulation and supports testosterone production.",
    whatItMeasures:
      "Luteinizing hormone. Female midcycle peaks are large; postmenopausal values run higher.",
    whyItMatters:
      "Interpreted with FSH, estradiol, and testosterone depending on the question. This app does not diagnose PCOS or pituitary disease.",
    understandingLevels:
      "Adult men are graded on Mayo’s male interval. Female rows are not graded without cycle day or menopausal status.",
    influencingFactors: [
      "Cycle phase",
      "Pituitary and gonadal feedback",
      "Assay method",
    ],
  }),

  prolactin: base({
    summary:
      "Prolactin is a pituitary hormone involved in lactation and reproductive signaling.",
    whatItMeasures:
      "Serum prolactin. Stress, sleep, meals, and some medicines raise it.",
    whyItMatters:
      "Marked elevations are a reason to talk with a clinician; mild bumps are common and often not a disease.",
    understandingLevels:
      "Mayo publishes sex-specific adult intervals. Inside the interval the grade caps at good. Repeat fasting morning draws are sometimes used when the first value is unexpected.",
    influencingFactors: [
      "Stress, sleep, and nipple stimulation",
      "Medications (including some antipsychotics and antiemetics)",
      "Pregnancy and hypothyroidism",
    ],
  }),

  psa: base({
    summary:
      "PSA is a protein made by prostate tissue that can appear in blood.",
    whatItMeasures:
      "Prostate-specific antigen. Age-banded screening intervals exist for men; it is not applicable on typical female reports.",
    whyItMatters:
      "PSA is a screening and monitoring tool, not a cancer diagnosis. Infection, bike riding, and ejaculation can raise it briefly.",
    understandingLevels:
      "Male rows use Mayo PSAFT age-banded highs. Female reports show range not available rather than a male cutoff.",
    influencingFactors: [
      "Age and prostate size",
      "Infection, procedures, and recent ejaculation",
      "Medications that shrink the prostate",
    ],
  }),

  "tc-hdl-ratio": base({
    summary:
      "The total cholesterol to HDL ratio is total cholesterol divided by HDL.",
    whatItMeasures:
      "A calculated ratio (units cancel). Labs that report both numbers can print this; it is not a separate chemical assay.",
    whyItMatters:
      "Quest’s standard lipid panel flags the ratio at 5.0. Many clinicians now prefer non-HDL, LDL, or ApoB over the ratio alone.",
    understandingLevels:
      "Quest test 7600 publishes Cholesterol/HDL Ratio (calc) <5.0 for adults of both sexes. This catalog grades <5 as good and ≥5 as attention. No interior “ideal 3.5” band is claimed because Quest does not print one. This is not a personal heart-disease score.",
    ifHigher: [
      "Emphasize fiber, unsaturated fats, activity, and not smoking",
      "Review LDL, HDL, triglycerides, and overall cardiovascular risk with a clinician",
    ],
    influencingFactors: [
      "Total cholesterol and HDL (either can move the ratio)",
      "Dietary pattern, activity, and body composition",
      "Genetics and lipid-lowering therapy, if prescribed",
    ],
    learnMore: [
      {
        label: "Quest Diagnostics — Lipid Panel, Standard (7600)",
        url: "https://testdirectory.questdiagnostics.com/test/test-detail/7600/lipid-panel-standard",
      },
    ],
  }),

  "ldl-hdl-ratio": base({
    summary:
      "The LDL to HDL ratio is LDL cholesterol divided by HDL cholesterol.",
    whatItMeasures:
      "A calculated ratio from the two cholesterol fractions.",
    whyItMatters:
      "Quest publishes sex-specific Below Average / Average / Moderate / High Risk tiers for this calculated ratio. LDL, non-HDL, and ApoB still carry more guideline weight than the ratio alone.",
    understandingLevels:
      "Quest 19543: men Below Average <2.28, Average to 4.90, Moderate to 7.12, High Risk >7.13; women <2.34 / to 4.12 / to 5.56 / >5.57. Lower sits on the more favorable side of those catalog tiers. This app does not assign you a cardiovascular-risk category.",
    ifHigher: [
      "Increase soluble fiber and activity; limit saturated fat",
      "Look at LDL and HDL separately with a clinician, not only the ratio",
    ],
    influencingFactors: [
      "LDL and HDL concentrations",
      "Diet, activity, and not smoking",
      "Genetics and lipid-lowering therapy, if prescribed",
    ],
    learnMore: [
      {
        label: "Quest Diagnostics — Lipid Panel with Ratios (19543)",
        url: "https://testdirectory.questdiagnostics.com/test/test-detail/19543/lipid-panel-with-ratios",
      },
    ],
  }),

  "ldl-apo-b-ratio": base({
    summary:
      "The LDL-C to ApoB ratio relates cholesterol in LDL to the number of ApoB particles.",
    whatItMeasures:
      "A calculated ratio sometimes used in research as a rough particle-size clue (higher often means more cholesterol per particle).",
    whyItMatters:
      "No Mayo, Quest, or ACC/AHA catalog interval is attached here, so the value is shown without an optimization grade. Particle-size papers are not a named lab catalog.",
    understandingLevels:
      "Range not available until a named lab catalog or guideline publishes cutpoints we can cite. ApoB itself is usually the more useful number.",
    influencingFactors: [
      "LDL cholesterol and ApoB",
      "Triglycerides (high TG often travel with smaller, denser particles)",
      "Assay methods for LDL and ApoB",
    ],
    discussWithClinician:
      "Ask whether ApoB, LDL, and non-HDL already answer the clinical question — this ratio is extra context, not a diagnosis.",
  }),

  "tg-hdl-ratio": base({
    summary:
      "The triglycerides to HDL ratio is fasting triglycerides divided by HDL.",
    whatItMeasures:
      "A calculated ratio. Units must match (both mg/dL, or both mmol/L) or the number is not comparable to published papers.",
    whyItMatters:
      "Quest 37848 (Lipid Panel with Triglycerides/HDL-Cholesterol) prints See Laboratory Report, not a cutpoint. McLaughlin-style papers disagree (~3.0 vs ~3.5 in mg/dL, and they differ by sex and units). No guideline or named lab catalog is attached here.",
    understandingLevels:
      "Range not available — we do not invent a cutpoint where papers disagree. Triglycerides and HDL are graded separately when sourced.",
    influencingFactors: [
      "Fasting triglycerides and HDL",
      "Carbohydrate pattern, alcohol, and body composition",
      "Whether the lab used mg/dL or mmol/L",
    ],
  }),

  "bun-creatinine-ratio": base({
    summary:
      "The BUN:creatinine ratio is urea nitrogen divided by creatinine.",
    whatItMeasures:
      "A calculated ratio used as a teaching pattern (often discussed around 10–20), not a standalone kidney diagnosis.",
    whyItMatters:
      "Quest 296 publishes an adult calculated interval of 6–22 for ages ≥17. Textbooks often discuss ~10–20 as a teaching pattern; this catalog uses the Quest interval, not the textbook shorthand. Still read BUN and creatinine on their own sourced rows.",
    understandingLevels:
      "Quest 296: ages ≥17, 6–22 (calc). Values inside that interval cap at good; outside are attention. No interior optimum. Not graded under 17 here (Quest prints different pediatric rows).",
    learnMore: [
      {
        label: "Quest Diagnostics — BUN/Creatinine Ratio (296)",
        url: "https://testdirectory.questdiagnostics.com/test/test-detail/296/buncreatinine-ratio?cc=MASTER",
      },
    ],
    influencingFactors: [
      "Hydration and protein intake",
      "The separate BUN and creatinine results",
      "GI bleeding and some medications (can raise BUN relative to creatinine)",
    ],
  }),

  "ast-alt-ratio": base({
    summary:
      "The AST:ALT ratio is AST divided by ALT (sometimes called the De Ritis ratio).",
    whatItMeasures:
      "A calculated enzyme ratio. Pattern recognition is not the same as a healthy-person reference interval.",
    whyItMatters:
      "Clinicians sometimes glance at this ratio alongside the absolute AST and ALT values. It is not graded here because Mayo and Quest publish the enzymes, not a De Ritis catalog interval.",
    understandingLevels:
      "Range not available. Use the sourced AST and ALT rows; discuss unexpected pairs with a clinician rather than treating the ratio as a diagnosis.",
    influencingFactors: [
      "The separate AST and ALT results",
      "Alcohol, medications, and muscle injury (AST also comes from muscle)",
      "Assay method",
    ],
  }),

  "free-t3-free-t4-ratio": base({
    summary:
      "The free T3 to free T4 ratio is a calculated thyroid-hormone comparison.",
    whatItMeasures:
      "Free T3 divided by free T4. Assays differ, so published “optimal” wellness cutoffs are not interchangeable.",
    whyItMatters:
      "No named lab catalog interval is attached, so the value is shown without a grade. TSH, free T4, and free T3 are the sourced thyroid markers.",
    understandingLevels:
      "Range not available. Prefer the individual free T3 and free T4 results plus TSH.",
    influencingFactors: [
      "The paired free T3 and free T4 assays",
      "Illness that lowers T3 conversion",
      "Biotin interference",
    ],
  }),

  "tsh-t4-ratio": base({
    summary:
      "The TSH to T4 ratio is TSH divided by a T4 result (total or free, depending on the lab).",
    whatItMeasures:
      "A calculated ratio. The denominator must be the same T4 assay the lab used or the number is not comparable.",
    whyItMatters:
      "No Mayo or guideline interval is attached. TSH and free T4 are graded on their own sourced rows.",
    understandingLevels:
      "Range not available. Read TSH and free T4 separately.",
    influencingFactors: [
      "Which T4 assay sits in the denominator",
      "Pituitary and thyroid status",
      "Assay method",
    ],
  }),

  fai: base({
    summary:
      "Free androgen index (FAI) is (total testosterone / SHBG) × 100.",
    whatItMeasures:
      "A calculated index, not a measured free-hormone assay. Units of testosterone and SHBG must match the lab’s formula.",
    whyItMatters:
      "Some labs print FAI in androgen workups. Labcorp 146688 publishes sex- and age-specific intervals for the printed index (total testosterone / SHBG) × 100.",
    understandingLevels:
      "Labcorp 146688: adult men 18-29 30-128, 30-39 24-122, 40-49 14-126, ≥50 18-82; adult women 18-49 0.4-8.4, ≥50 0.4-6.6. Bands are attention / good / attention. This grades a lab-printed FAI, not a recalculation from testosterone and SHBG in this app.",
    learnMore: [
      {
        label: "Labcorp — Free Androgen Index (146688)",
        url: "https://www.labcorp.com/tests/146688/free-androgen-index-fai",
      },
    ],
    influencingFactors: [
      "Total testosterone and SHBG",
      "The lab’s unit convention",
      "Time of day",
    ],
  }),

  "percent-free-testosterone": base({
    summary:
      "% free testosterone is free testosterone as a share of the total.",
    whatItMeasures:
      "A calculated percentage. It moves when SHBG moves, even if production is unchanged.",
    whyItMatters:
      "Mayo TGRP and Quest 18944 publish free testosterone as a concentration (ng/dL or pg/mL), not a percent-of-total interval. The free and total testosterone rows carry the sourced intervals.",
    understandingLevels:
      "Range not available. Prefer free testosterone (with method named) and SHBG.",
    influencingFactors: [
      "SHBG",
      "Assay methods for free vs total testosterone",
    ],
  }),

  "testosterone-cortisol-ratio": base({
    summary:
      "The testosterone to cortisol ratio is a calculated comparison of those two hormones.",
    whatItMeasures:
      "A ratio sometimes discussed in sports or stress research. Draw time, units, and free vs total testosterone all change the number.",
    whyItMatters:
      "No guideline or Mayo interval is attached. Cortisol here is the morning Mayo interval; mixing a PM cortisol with a testosterone would mislead.",
    understandingLevels:
      "Range not available — we do not invent an athletic “anabolic/catabolic” cutpoint.",
    influencingFactors: [
      "Draw time (cortisol falls through the day)",
      "Which testosterone fraction is used",
      "Sleep, training load, and acute stress",
    ],
  }),

  "cortisol-dhea-s-ratio": base({
    summary:
      "The cortisol to DHEA-S ratio compares a morning (or random) cortisol with DHEA-S.",
    whatItMeasures:
      "A calculated ratio. Cortisol is highly time-of-day dependent; DHEA-S is more stable.",
    whyItMatters:
      "Wellness panels sometimes print this ratio. No named lab catalog interval is attached, so it is not graded.",
    understandingLevels:
      "Range not available. Read morning cortisol and DHEA-S on their sourced rows.",
    influencingFactors: [
      "Draw time for cortisol",
      "Age (DHEA-S declines over adult life)",
      "Acute illness and glucocorticoid medicines",
    ],
  }),
};

export function getBiomarkerExplanation(
  biomarkerId: string,
): BiomarkerExplanation | undefined {
  return BIOMARKER_EXPLANATIONS[biomarkerId];
}

/** User-facing citation text — hide internal review flags. */
export function formatSourceCitation(citation?: string, label?: string): string {
  if (!citation) return label ?? "Source";
  return citation.replace(/^NEEDS CLINICIAN REVIEW:\s*/i, "").trim();
}
