import { useState, useCallback, useEffect, useRef } from 'react';
import { Paper, PaperStatus, BackendHealth, ChatMessage } from '@/types/paper';

const MOCK_PAPERS: Paper[] = [
  {
    id: '1', pmid: '38901234', title: 'IL-6 trans-signaling in rheumatoid arthritis: mechanisms and therapeutic implications',
    authors: 'Tanaka T, Kishimoto T, Narazaki M', journal: 'Nat Rev Rheumatol', year: 2024, doi: '10.1038/s41584-024-01234-5',
    abstract: 'Interleukin-6 (IL-6) plays a pivotal role in the pathogenesis of rheumatoid arthritis (RA) through both classical and trans-signaling pathways. This review examines the molecular mechanisms underlying IL-6-mediated joint inflammation and destruction, with particular emphasis on the soluble IL-6 receptor complex and its downstream effects on synovial fibroblasts, osteoclasts, and T-cell differentiation.',
    status: 'ingested', pdfSource: 'Europe PMC', licence: 'CC BY 4.0', availability: 'available', dateAdded: '2024-03-15',
  },
  {
    id: '2', pmid: '38876543', title: 'JAK inhibitors in systemic lupus erythematosus: a systematic review and network meta-analysis',
    authors: 'Chen W, Liu Y, Zhang H, Wang X', journal: 'Lancet Rheumatol', year: 2024, doi: '10.1016/S2665-9913(24)00087-3',
    abstract: 'Background: JAK inhibitors represent a promising therapeutic approach for systemic lupus erythematosus (SLE). We conducted a systematic review and network meta-analysis to compare the efficacy and safety of different JAK inhibitors in SLE patients who had inadequate response to standard therapy.',
    status: 'processing', pdfSource: 'Unpaywall', statusNote: 'Extracting figures and tables...', availability: 'available', dateAdded: '2024-03-14',
  },
  {
    id: '3', pmid: '38854321', title: 'Single-cell transcriptomics reveals pathogenic Th17 cell states in psoriatic arthritis',
    authors: 'Patel R, Kumar S, Sharma A, Gupta N', journal: 'Cell Rep Med', year: 2024, doi: '10.1016/j.xcrm.2024.01432',
    abstract: 'Psoriatic arthritis (PsA) is characterized by heterogeneous T-cell responses. Using single-cell RNA sequencing of synovial fluid and peripheral blood from 45 PsA patients, we identified distinct pathogenic Th17 cell subsets expressing GM-CSF and exhibiting tissue-resident memory phenotypes.',
    status: 'queued', pdfSource: 'bioRxiv', availability: 'preprint', dateAdded: '2024-03-13',
  },
  {
    id: '4', pmid: '38832109', title: 'Gut microbiome dysbiosis and autoimmune arthritis: causal insights from Mendelian randomization',
    authors: 'Scher JU, Abramson SB, Littman DR', journal: 'Ann Rheum Dis', year: 2023, doi: '10.1136/ard-2023-224567',
    abstract: 'The gut-joint axis has emerged as a critical factor in autoimmune arthritis. Leveraging genome-wide association study data from the Dutch Microbiome Project (n=8,208) and international RA consortia, we performed bidirectional Mendelian randomization analyses to assess causal relationships between 211 gut bacterial taxa and rheumatoid arthritis risk.',
    status: 'failed', statusNote: 'PDF download timed out. Retry available.', availability: 'requires_access', dateAdded: '2024-03-12',
  },
  {
    id: '5', pmid: '38810987', title: 'CRISPR-edited CAR-T cells targeting citrullinated antigens in refractory RA: phase I results',
    authors: 'Zhang L, Wu M, Chen F, Li J', journal: 'Sci Transl Med', year: 2024, doi: '10.1126/scitranslmed.abq8765',
    abstract: 'We report first-in-human results of CRISPR-Cas9-edited chimeric antigen receptor T cells engineered to deplete B cells presenting citrullinated protein antigens in 12 patients with refractory rheumatoid arthritis. At 24 weeks, 8 of 12 patients achieved ACR50 response with durable B-cell depletion in synovial tissue.',
    status: 'ingested', pdfSource: 'Europe PMC', licence: 'CC BY-NC 4.0', availability: 'available', dateAdded: '2024-03-10',
  },
  {
    id: '6', pmid: '38798765', title: 'Machine learning prediction of biologic treatment response in ankylosing spondylitis',
    authors: 'O\'Brien M, Fitzgerald O, Veale DJ', journal: 'Arthritis Rheumatol', year: 2023, doi: '10.1002/art.42890',
    abstract: 'Predicting response to biologic therapy remains challenging in ankylosing spondylitis (AS). We developed a multi-modal machine learning framework integrating clinical, genetic, and proteomic data from 1,247 AS patients treated with TNF inhibitors or IL-17A inhibitors across five European centers.',
    status: 'not_found', statusNote: 'No open-access PDF available via any source.', availability: 'requires_access', dateAdded: '2024-03-08',
  },
];

const MOCK_SEARCH_RESULTS: Paper[] = [
  {
    id: 's1', pmid: '39012345', title: 'Baricitinib versus adalimumab in methotrexate-naive RA: 5-year follow-up of RA-BEGIN',
    authors: 'Fleischmann R, Schiff M, van der Heijde D', journal: 'Lancet', year: 2024, doi: '10.1016/S0140-6736(24)00234-5',
    abstract: 'Long-term outcomes of initial treatment strategies comparing baricitinib monotherapy, baricitinib plus methotrexate, and adalimumab plus methotrexate in patients with early active rheumatoid arthritis.',
    status: 'ingested', licence: 'CC BY 4.0', availability: 'available', dateAdded: '',
  },
  {
    id: 's2', pmid: '39023456', title: 'Upadacitinib in axial spondyloarthritis: SELECT-AXIS 2 trial results',
    authors: 'van der Heijde D, Deodhar A, Baraliakos X', journal: 'N Engl J Med', year: 2024, doi: '10.1056/NEJMoa2400123',
    abstract: 'Upadacitinib, an oral selective JAK1 inhibitor, was evaluated in patients with active non-radiographic axial spondyloarthritis in this phase 3 randomized trial.',
    status: 'queued', availability: 'available', licence: 'Subscription', dateAdded: '',
  },
  {
    id: 's3', pmid: '39034567', title: 'Anti-GM-CSF therapy for giant cell arteritis: a randomised controlled trial',
    authors: 'Wicks IP, Langdon J, Roberts A', journal: 'Ann Intern Med', year: 2024, doi: '10.7326/M24-0567',
    abstract: 'GM-CSF drives macrophage activation in giant cell arteritis. This phase 2b trial randomised 164 patients with newly diagnosed GCA to otilimab or placebo.',
    status: 'queued', availability: 'preprint', licence: 'CC BY-NC 4.0', dateAdded: '',
  },
  {
    id: 's4', pmid: '39045678', title: 'Spatial transcriptomics of the rheumatoid synovium reveals distinct fibroblast niches',
    authors: 'Croft AP, Naylor AJ, Buckley CD', journal: 'Nature', year: 2024, doi: '10.1038/s41586-024-07234-5',
    abstract: 'Using Visium spatial transcriptomics and multiplexed protein imaging of synovial biopsies from 38 RA patients, we mapped spatial organization of pathogenic fibroblast subsets.',
    status: 'queued', availability: 'available', licence: 'CC BY 4.0', dateAdded: '',
  },
  {
    id: 's5', pmid: '39056789', title: 'Tofacitinib dose reduction strategies in stable RA: ORAL Shift randomised trial',
    authors: 'Wollenhaupt J, Lee EB, Curtis JR', journal: 'Arthritis Rheumatol', year: 2024, doi: '10.1002/art.42901',
    abstract: 'This trial evaluated tapering tofacitinib from 5 mg BID to 5 mg QD in RA patients achieving sustained low disease activity, showing non-inferiority for the primary endpoint.',
    status: 'queued', availability: 'available', licence: 'CC BY 4.0', dateAdded: '',
  },
  {
    id: 's6', pmid: '39067890', title: 'Multi-omic profiling identifies novel biomarkers for early RA diagnosis',
    authors: 'Rao DA, Arazi A, Engel AJ', journal: 'Sci Transl Med', year: 2024, doi: '10.1126/scitranslmed.ade1234',
    abstract: 'Integrating transcriptomics, proteomics, and metabolomics from pre-clinical RA cohorts identified a 12-analyte signature predicting RA onset 3 years before symptom development.',
    status: 'queued', availability: 'available', licence: 'CC BY-NC 4.0', dateAdded: '',
  },
  {
    id: 's7', pmid: '39078901', title: 'Filgotinib long-term safety: pooled analysis of FINCH programme',
    authors: 'Genovese MC, Kalunian K, Engel B', journal: 'Ann Rheum Dis', year: 2023, doi: '10.1136/ard-2023-225678',
    abstract: 'Pooled safety analysis from the FINCH 1-4 trials of filgotinib over 156 weeks in over 3,400 RA patients showed low incidence of major adverse cardiovascular events and venous thromboembolism.',
    status: 'queued', availability: 'available', licence: 'CC BY 4.0', dateAdded: '',
  },
  {
    id: 's8', pmid: '39089012', title: 'Rituximab biosimilar CT-P10 in ANCA-associated vasculitis: COMBIVAS trial',
    authors: 'Jones RB, Tervaert JW, Hauser T', journal: 'Lancet Rheumatol', year: 2024, doi: '10.1016/S2665-9913(24)00102-7',
    abstract: 'CT-P10 demonstrated equivalent efficacy and comparable safety to reference rituximab in inducing remission in severe ANCA-associated vasculitis over 18 months.',
    status: 'queued', availability: 'preprint', licence: 'Subscription', dateAdded: '',
  },
  {
    id: 's9', pmid: '39090123', title: 'Secukinumab versus TNF inhibitors in PsA with axial involvement: head-to-head trial',
    authors: 'McInnes IB, Mease PJ, Ritchlin CT', journal: 'JAMA', year: 2024, doi: '10.1001/jama.2024.5678',
    abstract: 'First head-to-head trial comparing secukinumab to adalimumab in psoriatic arthritis patients with confirmed axial disease demonstrated superior spinal outcomes with IL-17A inhibition.',
    status: 'queued', availability: 'available', licence: 'CC BY 4.0', dateAdded: '',
  },
  {
    id: 's10', pmid: '39101234', title: 'Microbiome-directed therapy restores gut barrier in spondyloarthritis',
    authors: 'Costello ME, Ciccia F, Brown MA', journal: 'Nat Med', year: 2024, doi: '10.1038/s41591-024-02890-1',
    abstract: 'A precision microbiome intervention targeting Prevotella copri abundance restored intestinal permeability and reduced inflammatory markers in 68 spondyloarthritis patients.',
    status: 'queued', availability: 'available', licence: 'CC BY 4.0', dateAdded: '',
  },
  {
    id: 's11', pmid: '39112345', title: 'Dual JAK1/TYK2 inhibition in dermatomyositis: phase 2 results',
    authors: 'Aggarwal R, Oddis CV, Engel AG', journal: 'N Engl J Med', year: 2024, doi: '10.1056/NEJMoa2401234',
    abstract: 'Brepocitinib, a dual JAK1/TYK2 inhibitor, showed significant improvement in CDASI activity score versus placebo at 24 weeks in moderate-to-severe dermatomyositis.',
    status: 'queued', availability: 'requires_access', dateAdded: '',
  },
  {
    id: 's12', pmid: '39123456', title: 'Lupus nephritis flare prediction using urinary proteomic panels',
    authors: 'Dall\'Era M, Wofsy D, Mackay M', journal: 'Arthritis Rheumatol', year: 2023, doi: '10.1002/art.42950',
    abstract: 'A 7-protein urinary panel predicted lupus nephritis flares with 89% sensitivity up to 3 months before clinical relapse, enabling pre-emptive treatment escalation.',
    status: 'queued', availability: 'available', licence: 'CC BY-NC 4.0', dateAdded: '',
  },
  {
    id: 's13', pmid: '39134567', title: 'Anifrolumab in systemic sclerosis-associated ILD: exploratory endpoints from ATLAS',
    authors: 'Khanna D, Denton CP, Distler O', journal: 'Lancet Respir Med', year: 2024, doi: '10.1016/S2213-2600(24)00145-8',
    abstract: 'Post-hoc analysis of the ATLAS trial suggests anifrolumab may slow FVC decline in systemic sclerosis patients with progressive interstitial lung disease.',
    status: 'queued', availability: 'preprint', licence: 'Subscription', dateAdded: '',
  },
  {
    id: 's14', pmid: '39145678', title: 'Deep learning radiographic scoring outperforms rheumatologists in RA progression',
    authors: 'Langs G, Aletaha D, Glocker B', journal: 'Radiology', year: 2024, doi: '10.1148/radiol.2024231567',
    abstract: 'A convolutional neural network trained on 48,000 hand/foot radiographs achieved superior inter-reader agreement and detected erosive progression earlier than expert rheumatologists.',
    status: 'queued', availability: 'available', licence: 'CC BY 4.0', dateAdded: '',
  },
  {
    id: 's15', pmid: '39156789', title: 'Telitacicept dual BLyS/APRIL blockade in refractory IgA nephropathy',
    authors: 'Zhang H, Barratt J, Bhatt DL', journal: 'J Am Soc Nephrol', year: 2024, doi: '10.1681/ASN.2024010089',
    abstract: 'Telitacicept achieved 52% reduction in proteinuria at 48 weeks in IgA nephropathy patients refractory to supportive care, with acceptable safety profile.',
    status: 'queued', availability: 'available', licence: 'CC BY 4.0', dateAdded: '',
  },
  {
    id: 's16', pmid: '39167890', title: 'Wearable-detected flare signatures in axial spondyloarthritis',
    authors: 'Siebert S, Engel B, McInnes IB', journal: 'Digit Biomark', year: 2024, doi: '10.1159/000538901',
    abstract: 'Continuous accelerometer and heart-rate data from smartwatches identified digital biomarkers that predicted axSpA flares 5 days before patient-reported symptom onset.',
    status: 'queued', availability: 'available', licence: 'CC BY 4.0', dateAdded: '',
  },
  {
    id: 's17', pmid: '39178901', title: 'Ixekizumab in juvenile psoriatic arthritis: SPIRIT-JIA open-label extension',
    authors: 'Brunner HI, Foeldvari I, Engel AG', journal: 'Pediatr Rheumatol', year: 2024, doi: '10.1186/s12969-024-00912-4',
    abstract: 'Ixekizumab demonstrated sustained JIA ACR70 response in 61% of juvenile PsA patients through 104 weeks with no new safety signals in the paediatric population.',
    status: 'queued', availability: 'available', licence: 'CC BY 4.0', dateAdded: '',
  },
  {
    id: 's18', pmid: '39189012', title: 'Epigenetic clock acceleration in early systemic lupus erythematosus',
    authors: 'Coit P, Jeffries MA, Sawalha AH', journal: 'Genome Med', year: 2024, doi: '10.1186/s13073-024-01334-9',
    abstract: 'DNA methylation-based biological age exceeded chronological age by 4.7 years in newly diagnosed SLE patients, correlating with interferon signature score and organ damage accrual.',
    status: 'queued', availability: 'requires_access', dateAdded: '',
  },
];

export function usePaperStore() {
  const [papers, setPapers] = useState<Paper[]>(MOCK_PAPERS);
  const [backendHealth, setBackendHealth] = useState<BackendHealth>('connecting');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  // Simulate backend connection
  useEffect(() => {
    const t = setTimeout(() => setBackendHealth('ready'), 1500);
    return () => clearTimeout(t);
  }, []);

  // Simulate processing papers progressing
  useEffect(() => {
    const hasProcessing = papers.some(p => p.status === 'processing' || p.status === 'queued');
    if (!hasProcessing) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(() => {
      setPapers(prev => prev.map(p => {
        if (p.status === 'processing' && Math.random() > 0.7) {
          return { ...p, status: 'ingested' as PaperStatus, statusNote: undefined };
        }
        if (p.status === 'queued' && Math.random() > 0.8) {
          return { ...p, status: 'processing' as PaperStatus, statusNote: 'Downloading PDF...' };
        }
        return p;
      }));
    }, 10000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [papers]);

  // Visibility change re-poll
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible') {
        setPapers(prev => [...prev]); // trigger re-render
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  const stats = {
    total: papers.length,
    ready: papers.filter(p => p.status === 'ingested').length,
    processing: papers.filter(p => p.status === 'processing' || p.status === 'queued').length,
    needRetry: papers.filter(p => p.status === 'failed' || p.status === 'not_found').length,
  };

  const addPaper = useCallback((paper: Paper) => {
    setPapers(prev => {
      if (prev.find(p => p.pmid === paper.pmid)) return prev;
      return [{ ...paper, status: 'queued' as PaperStatus, dateAdded: new Date().toISOString().split('T')[0] }, ...prev];
    });
  }, []);

  const sendMessage = useCallback((content: string) => {
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content };
    setChatMessages(prev => [...prev, userMsg]);

    // Simulate response
    setTimeout(() => {
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Based on the ${stats.ready} papers in your library, here's what I found:\n\n**Key findings:**\n\nIL-6 trans-signaling plays a central role in RA pathogenesis through activation of the JAK/STAT3 pathway in synovial fibroblasts¹. Recent single-cell studies have revealed distinct pathogenic Th17 subsets expressing GM-CSF in psoriatic arthritis synovial fluid².\n\nJAK inhibitors show promise across multiple autoimmune conditions, with network meta-analyses suggesting comparable efficacy to biologics in SLE³.\n\nCRISPR-edited CAR-T cells targeting citrullinated antigens achieved ACR50 in 67% of refractory RA patients at 24 weeks⁴.`,
        sourceCount: 4,
        rewrittenQuery: content.length > 20 ? `(${content.slice(0, 30)}...) AND (rheumatoid arthritis OR autoimmune)` : undefined,
        citations: ['Tanaka 2024', 'Patel 2024', 'Chen 2024', 'Zhang 2024'],
      };
      setChatMessages(prev => [...prev, assistantMsg]);
    }, 2000);
  }, [stats.ready]);

  const searchPapers = MOCK_SEARCH_RESULTS;

  return { papers, stats, backendHealth, chatMessages, addPaper, sendMessage, searchPapers };
}
