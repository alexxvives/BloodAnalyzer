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
      "Urea (often reported as blood urea nitrogen / BUN in US labs) is a waste product from protein metabolism filtered by the kidneys.",
    whatItMeasures:
      "How much urea nitrogen/urea is in blood. Units and naming differ by country (BUN vs urea); always match the unit on your report.",
    whyItMatters:
      "Urea rises when kidney filtration falls, when protein intake is high, or when you are dehydrated. It is interpreted with creatinine, eGFR, and clinical context — not alone.",
    understandingLevels:
      "Mildly high urea with normal creatinine can reflect dehydration or a high-protein meal pattern. Rising urea with rising creatinine more often prompts kidney-function review.",
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
      "High transferrin + low ferritin commonly fits iron deficiency; low transferrin + high ferritin can fit anemia of inflammation — clinicians integrate the pattern.",
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
