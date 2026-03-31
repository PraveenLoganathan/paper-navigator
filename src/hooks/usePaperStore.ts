import { useState, useCallback, useEffect, useRef } from 'react';
import {
  LibraryDocument,
  SearchPaper,
  SearchResponse,
  PaperStatus,
  BackendHealth,
  ChatMessage,
  QuerySource,
} from '@/types/paper';

// ── Mock library documents (matches /api/query/documents) ──

const MOCK_DOCUMENTS: LibraryDocument[] = [
  {
    doc_id: 'doc-1', pmid: '38901234', doi: '10.1038/s41584-024-01234-5',
    title: 'IL-6 trans-signaling in rheumatoid arthritis: mechanisms and therapeutic implications',
    journal: 'Nat Rev Rheumatol', pub_year: '2024', published_date: '2024-03-15',
    pdf_source: 'europe_pmc', verified: true, page_count: 14, chunk_count: 98,
    ingested_at: '2024-03-15T08:00:00Z', status: 'ingested',
  },
  {
    doc_id: 'doc-2', pmid: '38876543', doi: '10.1016/S2665-9913(24)00087-3',
    title: 'JAK inhibitors in systemic lupus erythematosus: a systematic review and network meta-analysis',
    journal: 'Lancet Rheumatol', pub_year: '2024', published_date: '2024-03-14',
    pdf_source: 'unpaywall', verified: false, page_count: 22, chunk_count: 140,
    ingested_at: '2024-03-14T12:00:00Z', status: 'processing',
  },
  {
    doc_id: 'doc-3', pmid: '38854321', doi: '10.1016/j.xcrm.2024.01432',
    title: 'Single-cell transcriptomics reveals pathogenic Th17 cell states in psoriatic arthritis',
    journal: 'Cell Rep Med', pub_year: '2024', published_date: '2024-03-13',
    pdf_source: 'biorxiv', verified: false, chunk_count: 0,
    ingested_at: '2024-03-13T09:00:00Z', status: 'queued',
  },
  {
    doc_id: 'doc-4', pmid: '38832109', doi: '10.1136/ard-2023-224567',
    title: 'Gut microbiome dysbiosis and autoimmune arthritis: causal insights from Mendelian randomization',
    journal: 'Ann Rheum Dis', pub_year: '2023', published_date: '2023-12-01',
    pdf_source: undefined, verified: false,
    ingested_at: '2024-03-12T06:00:00Z', status: 'failed',
  },
  {
    doc_id: 'doc-5', pmid: '38810987', doi: '10.1126/scitranslmed.abq8765',
    title: 'CRISPR-edited CAR-T cells targeting citrullinated antigens in refractory RA: phase I results',
    journal: 'Sci Transl Med', pub_year: '2024', published_date: '2024-03-10',
    pdf_source: 'europe_pmc', verified: true, page_count: 11, chunk_count: 76,
    ingested_at: '2024-03-10T14:00:00Z', status: 'ingested',
  },
  {
    doc_id: 'doc-6', pmid: '38798765', doi: '10.1002/art.42890',
    title: 'Machine learning prediction of biologic treatment response in ankylosing spondylitis',
    journal: 'Arthritis Rheumatol', pub_year: '2023', published_date: '2023-11-08',
    pdf_source: undefined, verified: false,
    ingested_at: '2024-03-08T10:00:00Z', status: 'not_found',
  },
];

// ── Mock search results (matches /api/papers/search .results[]) ──

const MOCK_SEARCH_RESULTS: SearchPaper[] = [
  {
    pmid: '39012345', doi: '10.1016/S0140-6736(24)00234-5', title: 'Baricitinib versus adalimumab in methotrexate-naive RA: 5-year follow-up of RA-BEGIN',
    authors: ['Fleischmann R', 'Schiff M', 'van der Heijde D'], journal: 'Lancet', year: '2024', published_date: '2024-03-15',
    abstract: 'Long-term outcomes of initial treatment strategies comparing baricitinib monotherapy, baricitinib plus methotrexate, and adalimumab plus methotrexate in patients with early active rheumatoid arthritis.',
    open_access: true, availability: 'available', licence: 'CC BY 4.0', source: 'europe_pmc',
  },
  {
    pmid: '39023456', doi: '10.1056/NEJMoa2400123', title: 'Upadacitinib in axial spondyloarthritis: SELECT-AXIS 2 trial results',
    authors: ['van der Heijde D', 'Deodhar A', 'Baraliakos X'], journal: 'N Engl J Med', year: '2024', published_date: '2024-01-22',
    abstract: 'Upadacitinib, an oral selective JAK1 inhibitor, was evaluated in patients with active non-radiographic axial spondyloarthritis in this phase 3 randomized trial.',
    open_access: false, availability: 'available', licence: 'Subscription', source: 'unpaywall',
  },
  {
    pmid: '39034567', doi: '10.7326/M24-0567', title: 'Anti-GM-CSF therapy for giant cell arteritis: a randomised controlled trial',
    authors: ['Wicks IP', 'Langdon J', 'Roberts A'], journal: 'Ann Intern Med', year: '2024', published_date: '2024-05-10',
    abstract: 'GM-CSF drives macrophage activation in giant cell arteritis. This phase 2b trial randomised 164 patients with newly diagnosed GCA to otilimab or placebo.',
    open_access: true, availability: 'preprint', licence: 'CC BY-NC 4.0', source: 'biorxiv',
  },
  {
    pmid: '39045678', doi: '10.1038/s41586-024-07234-5', title: 'Spatial transcriptomics of the rheumatoid synovium reveals distinct fibroblast niches',
    authors: ['Croft AP', 'Naylor AJ', 'Buckley CD'], journal: 'Nature', year: '2024', published_date: '2024-02-28',
    abstract: 'Using Visium spatial transcriptomics and multiplexed protein imaging of synovial biopsies from 38 RA patients, we mapped spatial organization of pathogenic fibroblast subsets.',
    open_access: true, availability: 'available', licence: 'CC BY 4.0', source: 'europe_pmc',
  },
  {
    pmid: '39056789', doi: '10.1002/art.42901', title: 'Tofacitinib dose reduction strategies in stable RA: ORAL Shift randomised trial',
    authors: ['Wollenhaupt J', 'Lee EB', 'Curtis JR'], journal: 'Arthritis Rheumatol', year: '2024', published_date: '2024-06-01',
    abstract: 'This trial evaluated tapering tofacitinib from 5 mg BID to 5 mg QD in RA patients achieving sustained low disease activity, showing non-inferiority for the primary endpoint.',
    open_access: true, availability: 'available', licence: 'CC BY 4.0', source: 'europe_pmc',
  },
  {
    pmid: '39067890', doi: '10.1186/s13073-024-01334-9', title: 'Multi-omic profiling identifies novel biomarkers for early RA diagnosis',
    authors: ['Rao DA', 'Arazi A', 'Engel AJ'], journal: 'Sci Transl Med', year: '2024', published_date: '2024-04-17',
    abstract: 'Integrating transcriptomics, proteomics, and metabolomics from pre-clinical RA cohorts identified a 12-analyte signature predicting RA onset 3 years before symptom development.',
    open_access: true, availability: 'available', licence: 'CC BY-NC 4.0', source: 'europe_pmc',
  },
  {
    pmid: '39078901', doi: '10.1136/ard-2023-225678', title: 'Filgotinib long-term safety: pooled analysis of FINCH programme',
    authors: ['Genovese MC', 'Kalunian K', 'Engel B'], journal: 'Ann Rheum Dis', year: '2023', published_date: '2023-11-05',
    abstract: 'Pooled safety analysis from the FINCH 1-4 trials of filgotinib over 156 weeks in over 3,400 RA patients showed low incidence of major adverse cardiovascular events and venous thromboembolism.',
    open_access: true, availability: 'available', licence: 'CC BY 4.0', source: 'europe_pmc',
  },
  {
    pmid: '39089012', doi: '10.1016/S2665-9913(24)00102-7', title: 'Rituximab biosimilar CT-P10 in ANCA-associated vasculitis: COMBIVAS trial',
    authors: ['Jones RB', 'Tervaert JW', 'Hauser T'], journal: 'Lancet Rheumatol', year: '2024',
    abstract: 'CT-P10 demonstrated equivalent efficacy and comparable safety to reference rituximab in inducing remission in severe ANCA-associated vasculitis over 18 months.',
    open_access: false, availability: 'preprint', licence: 'Subscription', source: 'unpaywall',
  },
  {
    pmid: '39090123', doi: '10.1001/jama.2024.5678', title: 'Secukinumab versus TNF inhibitors in PsA with axial involvement: head-to-head trial',
    authors: ['McInnes IB', 'Mease PJ', 'Ritchlin CT'], journal: 'JAMA', year: '2024',
    abstract: 'First head-to-head trial comparing secukinumab to adalimumab in psoriatic arthritis patients with confirmed axial disease demonstrated superior spinal outcomes with IL-17A inhibition.',
    open_access: true, availability: 'available', licence: 'CC BY 4.0', source: 'europe_pmc',
  },
  {
    pmid: '39101234', doi: '10.1038/s41591-024-02890-1', title: 'Microbiome-directed therapy restores gut barrier in spondyloarthritis',
    authors: ['Costello ME', 'Ciccia F', 'Brown MA'], journal: 'Nat Med', year: '2024',
    abstract: 'A precision microbiome intervention targeting Prevotella copri abundance restored intestinal permeability and reduced inflammatory markers in 68 spondyloarthritis patients.',
    open_access: true, availability: 'available', licence: 'CC BY 4.0', source: 'europe_pmc',
  },
  {
    pmid: '39112345', doi: '10.1056/NEJMoa2401234', title: 'Dual JAK1/TYK2 inhibition in dermatomyositis: phase 2 results',
    authors: ['Aggarwal R', 'Oddis CV', 'Engel AG'], journal: 'N Engl J Med', year: '2024',
    abstract: 'Brepocitinib, a dual JAK1/TYK2 inhibitor, showed significant improvement in CDASI activity score versus placebo at 24 weeks in moderate-to-severe dermatomyositis.',
    open_access: false, availability: 'requires_access',
  },
  {
    pmid: '39123456', doi: '10.1002/art.42950', title: 'Lupus nephritis flare prediction using urinary proteomic panels',
    authors: ["Dall'Era M", 'Wofsy D', 'Mackay M'], journal: 'Arthritis Rheumatol', year: '2023',
    abstract: 'A 7-protein urinary panel predicted lupus nephritis flares with 89% sensitivity up to 3 months before clinical relapse, enabling pre-emptive treatment escalation.',
    open_access: true, availability: 'available', licence: 'CC BY-NC 4.0', source: 'europe_pmc',
  },
  {
    pmid: '39134567', doi: '10.1016/S2213-2600(24)00145-8', title: 'Anifrolumab in systemic sclerosis-associated ILD: exploratory endpoints from ATLAS',
    authors: ['Khanna D', 'Denton CP', 'Distler O'], journal: 'Lancet Respir Med', year: '2024',
    abstract: 'Post-hoc analysis of the ATLAS trial suggests anifrolumab may slow FVC decline in systemic sclerosis patients with progressive interstitial lung disease.',
    open_access: false, availability: 'preprint', licence: 'Subscription', source: 'biorxiv',
  },
  {
    pmid: '39145678', doi: '10.1148/radiol.2024231567', title: 'Deep learning radiographic scoring outperforms rheumatologists in RA progression',
    authors: ['Langs G', 'Aletaha D', 'Glocker B'], journal: 'Radiology', year: '2024',
    abstract: 'A convolutional neural network trained on 48,000 hand/foot radiographs achieved superior inter-reader agreement and detected erosive progression earlier than expert rheumatologists.',
    open_access: true, availability: 'available', licence: 'CC BY 4.0', source: 'europe_pmc',
  },
  {
    pmid: '39156789', doi: '10.1681/ASN.2024010089', title: 'Telitacicept dual BLyS/APRIL blockade in refractory IgA nephropathy',
    authors: ['Zhang H', 'Barratt J', 'Bhatt DL'], journal: 'J Am Soc Nephrol', year: '2024',
    abstract: 'Telitacicept achieved 52% reduction in proteinuria at 48 weeks in IgA nephropathy patients refractory to supportive care, with acceptable safety profile.',
    open_access: true, availability: 'available', licence: 'CC BY 4.0', source: 'europe_pmc',
  },
  {
    pmid: '39167890', doi: '10.1159/000538901', title: 'Wearable-detected flare signatures in axial spondyloarthritis',
    authors: ['Siebert S', 'Engel B', 'McInnes IB'], journal: 'Digit Biomark', year: '2024',
    abstract: 'Continuous accelerometer and heart-rate data from smartwatches identified digital biomarkers that predicted axSpA flares 5 days before patient-reported symptom onset.',
    open_access: true, availability: 'available', licence: 'CC BY 4.0', source: 'europe_pmc',
  },
  {
    pmid: '39178901', doi: '10.1186/s12969-024-00912-4', title: 'Ixekizumab in juvenile psoriatic arthritis: SPIRIT-JIA open-label extension',
    authors: ['Brunner HI', 'Foeldvari I', 'Engel AG'], journal: 'Pediatr Rheumatol', year: '2024',
    abstract: 'Ixekizumab demonstrated sustained JIA ACR70 response in 61% of juvenile PsA patients through 104 weeks with no new safety signals in the paediatric population.',
    open_access: true, availability: 'available', licence: 'CC BY 4.0', source: 'europe_pmc',
  },
  {
    pmid: '39189012', doi: '10.1186/s13073-024-01334-9', title: 'Epigenetic clock acceleration in early systemic lupus erythematosus',
    authors: ['Coit P', 'Jeffries MA', 'Sawalha AH'], journal: 'Genome Med', year: '2024',
    abstract: 'DNA methylation-based biological age exceeded chronological age by 4.7 years in newly diagnosed SLE patients, correlating with interferon signature score and organ damage accrual.',
    open_access: false, availability: 'requires_access',
  },
];

export function usePaperStore() {
  const [documents, setDocuments] = useState<LibraryDocument[]>(MOCK_DOCUMENTS);
  const [backendHealth, setBackendHealth] = useState<BackendHealth>('connecting');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  // Simulate backend connection
  useEffect(() => {
    const t = setTimeout(() => setBackendHealth('ready'), 1500);
    return () => clearTimeout(t);
  }, []);

  // Simulate processing documents progressing
  useEffect(() => {
    const hasProcessing = documents.some(d => d.status === 'processing' || d.status === 'queued');
    if (!hasProcessing) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(() => {
      setDocuments(prev => prev.map(d => {
        if (d.status === 'processing' && Math.random() > 0.7) {
          return { ...d, status: 'ingested' as PaperStatus, verified: true, chunk_count: Math.floor(Math.random() * 120) + 40 };
        }
        if (d.status === 'queued' && Math.random() > 0.8) {
          return { ...d, status: 'processing' as PaperStatus };
        }
        return d;
      }));
    }, 10000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [documents]);

  // Visibility change re-poll
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible') {
        setDocuments(prev => [...prev]);
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  const stats = {
    total: documents.length,
    ready: documents.filter(d => d.status === 'ingested').length,
    processing: documents.filter(d => d.status === 'processing' || d.status === 'queued').length,
    needRetry: documents.filter(d => d.status === 'failed' || d.status === 'not_found').length,
  };

  const addPaperFromSearch = useCallback((paper: SearchPaper) => {
    setDocuments(prev => {
      if (prev.find(d => d.pmid === paper.pmid)) return prev;
      const newDoc: LibraryDocument = {
        doc_id: `doc-${Date.now()}`,
        title: paper.title,
        pmid: paper.pmid,
        doi: paper.doi,
        journal: paper.journal,
        pub_year: paper.year,
        published_date: paper.published_date,
        pdf_source: paper.source,
        verified: false,
        ingested_at: new Date().toISOString(),
        status: 'queued',
      };
      return [newDoc, ...prev];
    });
  }, []);

  const sendMessage = useCallback((content: string) => {
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content };
    setChatMessages(prev => [...prev, userMsg]);

    // Simulate response matching /api/query/query shape
    setTimeout(() => {
      const mockSources: QuerySource[] = [
        { citation: '[1]', chunk_id: 'chunk-001', doc_id: 'doc-1', document_title: 'IL-6 trans-signaling in rheumatoid arthritis', score: 0.92, section: 'Introduction', page: 3, caption: 'IL-6 classical vs trans-signaling', excerpt: 'IL-6 activates JAK/STAT3 through membrane-bound and soluble receptor complexes.' },
        { citation: '[2]', chunk_id: 'chunk-042', doc_id: 'doc-3', document_title: 'Single-cell transcriptomics reveals pathogenic Th17 cell states', score: 0.87, section: 'Results', page: 8, caption: 'GM-CSF+ Th17 subsets', excerpt: 'Distinct pathogenic Th17 subsets expressing GM-CSF were identified in synovial fluid.' },
        { citation: '[3]', chunk_id: 'chunk-019', doc_id: 'doc-2', document_title: 'JAK inhibitors in SLE: systematic review', score: 0.84, section: 'Discussion', page: 15, caption: 'Network meta-analysis outcomes', excerpt: 'JAK inhibitors showed comparable efficacy to biologics in SLE patients.' },
        { citation: '[4]', chunk_id: 'chunk-055', doc_id: 'doc-5', document_title: 'CRISPR-edited CAR-T cells in refractory RA', score: 0.81, section: 'Results', page: 6, caption: 'ACR50 response rates', excerpt: '8 of 12 patients achieved ACR50 at 24 weeks with durable B-cell depletion.' },
      ];

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Based on the ${stats.ready} papers in your library, here's what I found:\n\n**Key findings:**\n\nIL-6 trans-signaling plays a central role in RA pathogenesis through activation of the JAK/STAT3 pathway in synovial fibroblasts [1]. Recent single-cell studies have revealed distinct pathogenic Th17 subsets expressing GM-CSF in psoriatic arthritis synovial fluid [2].\n\nJAK inhibitors show promise across multiple autoimmune conditions, with network meta-analyses suggesting comparable efficacy to biologics in SLE [3].\n\nCRISPR-edited CAR-T cells targeting citrullinated antigens achieved ACR50 in 67% of refractory RA patients at 24 weeks [4].`,
        sources: mockSources,
        rewritten_query: content.length > 20 ? `(${content.slice(0, 30)}...) AND (rheumatoid arthritis OR autoimmune)` : undefined,
      };
      setChatMessages(prev => [...prev, assistantMsg]);
    }, 2000);
  }, [stats.ready]);

  const searchPapers = MOCK_SEARCH_RESULTS;

  return { documents, stats, backendHealth, chatMessages, addPaperFromSearch, sendMessage, searchPapers };
}
