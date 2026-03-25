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
    abstract: 'Long-term outcomes of initial treatment strategies comparing baricitinib monotherapy, baricitinib plus methotrexate, and adalimumab plus methotrexate in patients with early active rheumatoid arthritis. Extended follow-up demonstrates sustained clinical and radiographic benefits of the JAK inhibitor-containing regimens.',
    status: 'ingested', licence: 'CC BY 4.0', availability: 'available', dateAdded: '',
  },
  {
    id: 's2', pmid: '39023456', title: 'Upadacitinib in axial spondyloarthritis: SELECT-AXIS 2 trial results',
    authors: 'van der Heijde D, Deodhar A, Baraliakos X', journal: 'N Engl J Med', year: 2024, doi: '10.1056/NEJMoa2400123',
    abstract: 'Upadacitinib, an oral selective JAK1 inhibitor, was evaluated in patients with active non-radiographic axial spondyloarthritis. In this phase 3, randomized, double-blind trial, upadacitinib was superior to placebo in achieving ASAS40 response at week 14, with a safety profile consistent with prior studies.',
    status: 'queued', availability: 'available', licence: 'Subscription', dateAdded: '',
  },
  {
    id: 's3', pmid: '39034567', title: 'Anti-GM-CSF therapy for giant cell arteritis: a randomised controlled trial',
    authors: 'Wicks IP, Langdon J, Roberts A', journal: 'Ann Intern Med', year: 2024, doi: '10.7326/M24-0567',
    abstract: 'Granulocyte-macrophage colony-stimulating factor (GM-CSF) drives macrophage activation in giant cell arteritis. This phase 2b trial randomised 164 patients with newly diagnosed GCA to otilimab or placebo, both with a 26-week prednisolone taper. The primary endpoint of sustained glucocorticoid-free remission at 52 weeks was met.',
    status: 'queued', availability: 'preprint', licence: 'CC BY-NC 4.0', dateAdded: '',
  },
  {
    id: 's4', pmid: '39045678', title: 'Spatial transcriptomics of the rheumatoid synovium reveals distinct fibroblast niches',
    authors: 'Croft AP, Naylor AJ, Buckley CD', journal: 'Nature', year: 2024, doi: '10.1038/s41586-024-07234-5',
    abstract: 'Using Visium spatial transcriptomics and multiplexed protein imaging of synovial biopsies from 38 rheumatoid arthritis patients, we mapped the spatial organization of pathogenic fibroblast subsets within the inflamed joint, identifying niche-specific signaling networks that coordinate immune cell recruitment and tissue destruction.',
    status: 'queued', availability: 'available', licence: 'CC BY 4.0', dateAdded: '',
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
