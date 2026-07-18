import React, { useState, useRef } from 'react';
import { 
  Upload, Settings, Scale, Shield, DollarSign, 
  Lock, AlertTriangle, CheckCircle, BrainCircuit,
  Download, ArrowRight, User
} from 'lucide-react';

const App = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analyzedData, setAnalyzedData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const nextStep = () => setCurrentStep(prev => prev + 1);
  const resetApp = () => {
    setCurrentStep(1);
    setAnalyzedData(null);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".pdf")) {
      alert("Please upload a PDF file.");
      return;
    }

    setIsProcessing(true);
    setCurrentStep(2);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/analyze/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Analysis failed");
      }
      const data = await response.json();
      setAnalyzedData(data);
      setIsProcessing(false);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Error analyzing document. Please make sure the backend is running on port 8324 and the GEMINI_API_KEY is set in .env.");
      resetApp();
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <Shield size={32} color="#3b82f6" />
        <h1>Compliance Sentinel</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span className="text-muted">Powered by Gemini AI</span>
          {currentStep > 1 && (
            <button className="btn btn-outline" onClick={resetApp} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
              Start Over
            </button>
          )}
        </div>
      </header>

      {/* STEP 1: Upload */}
      {currentStep === 1 && (
        <div className="step-container">
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Contract Risk Intelligence</h2>
          <p className="text-muted" style={{ marginBottom: '3rem', maxWidth: '600px' }}>
            Upload your contract and let our specialized AI agents analyze, debate, and fix compliance risks instantly offline.
          </p>
          <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept=".pdf" 
              onChange={handleFileUpload}
            />
            <Upload size={48} className="upload-icon" />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Upload Contract PDF</h3>
            <p className="text-muted">Click here to browse for a PDF file</p>
          </div>
        </div>
      )}

      {/* STEP 2: Orchestrator & Agents */}
      {currentStep === 2 && (
        <div className="step-container orchestrator-view">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <Settings className={isProcessing ? "loader" : ""} size={32} color="#3b82f6" />
            <h2 style={{ fontSize: '1.5rem' }}>Orchestrator Agent</h2>
          </div>
          <p className="text-muted mb-4 text-left w-full">
            {isProcessing ? "Extracting text and dispatching to specialized agents (This may take a minute locally)..." : "Analysis complete."}
          </p>
          
          <div className="agents-grid w-full">
            <div className={`agent-card ${!isProcessing ? 'active' : ''}`}>
              <div className="agent-icon"><Scale size={24} color="#3b82f6" /></div>
              <h3>Legal Agent</h3>
              {!isProcessing && analyzedData && (
                <div style={{ fontSize: '0.875rem', textAlign: 'center' }}>
                  <span className={`text-${analyzedData.agents.legal.risk === 'High' ? 'danger' : 'warning'}`}>
                    {analyzedData.agents.legal.risk} Risk
                  </span>
                  <p className="text-muted mt-4">"{analyzedData.agents.legal.description}"</p>
                </div>
              )}
            </div>
            
            <div className={`agent-card ${!isProcessing ? 'active' : ''}`}>
              <div className="agent-icon"><Shield size={24} color="#f59e0b" /></div>
              <h3>Privacy Agent</h3>
              {!isProcessing && analyzedData && (
                <div style={{ fontSize: '0.875rem', textAlign: 'center' }}>
                  <span className={`text-${analyzedData.agents.privacy.risk === 'High' ? 'danger' : 'warning'}`}>
                    {analyzedData.agents.privacy.risk} Risk
                  </span>
                  <p className="text-muted mt-4">"{analyzedData.agents.privacy.description}"</p>
                </div>
              )}
            </div>
            
            <div className={`agent-card ${!isProcessing ? 'active' : ''}`}>
              <div className="agent-icon"><DollarSign size={24} color="#10b981" /></div>
              <h3>Finance Agent</h3>
              {!isProcessing && analyzedData && (
                <div style={{ fontSize: '0.875rem', textAlign: 'center' }}>
                  <span className={`text-${analyzedData.agents.finance.risk === 'High' ? 'danger' : analyzedData.agents.finance.risk === 'Medium' ? 'warning' : 'success'}`}>
                    {analyzedData.agents.finance.risk} Risk
                  </span>
                  <p className="text-muted mt-4">"{analyzedData.agents.finance.description}"</p>
                </div>
              )}
            </div>

            <div className={`agent-card ${!isProcessing ? 'active' : ''}`}>
              <div className="agent-icon"><Lock size={24} color="#ef4444" /></div>
              <h3>Security Agent</h3>
              {!isProcessing && analyzedData && (
                <div style={{ fontSize: '0.875rem', textAlign: 'center' }}>
                  <span className={`text-${analyzedData.agents.security.risk === 'High' ? 'danger' : analyzedData.agents.security.risk === 'Medium' ? 'warning' : 'success'}`}>
                    {analyzedData.agents.security.risk} Risk
                  </span>
                  <p className="text-muted mt-4">"{analyzedData.agents.security.description}"</p>
                </div>
              )}
            </div>
          </div>
          
          {!isProcessing && (
            <button className="btn btn-primary mt-8" onClick={nextStep}>
              View AI Debate <ArrowRight size={18} />
            </button>
          )}
        </div>
      )}

      {/* STEP 3: AI Debate */}
      {currentStep === 3 && analyzedData && (
        <div className="step-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <BrainCircuit size={32} color="#f59e0b" />
            <h2 style={{ fontSize: '1.5rem' }}>AI Debate in Progress</h2>
          </div>
          <p className="text-muted w-full" style={{ maxWidth: '600px' }}>
            Agents discuss conflicting clauses to reach a balanced verdict.
          </p>

          <div className="debate-box w-full card" style={{ maxWidth: '800px', textAlign: 'left' }}>
            <div className="chat-message left">
              <Scale size={24} color="#3b82f6" />
              <div className="message-bubble">
                <strong>Legal Agent</strong>
                <p className="text-muted mt-4">{analyzedData.debate.legal_view}</p>
              </div>
            </div>
            
            <div className="chat-message right">
              <div className="message-bubble">
                <strong>Reviewer Agent</strong>
                <p className="text-muted mt-4">{analyzedData.debate.reviewer_view}</p>
              </div>
              <User size={24} color="#94a3b8" />
            </div>

            <div className="chat-message center mt-4">
              <div className="message-bubble" style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Settings size={18} color="#f59e0b" />
                  <strong>Moderator Agent: Final Decision</strong>
                </div>
                <p className="text-muted mt-4">{analyzedData.debate.moderator_view}</p>
              </div>
            </div>
          </div>
          
          <button className="btn btn-primary mt-8" onClick={nextStep}>
            View Final Risk Score <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* STEP 4: Risk Agent Score */}
      {currentStep === 4 && analyzedData && (
        <div className="step-container">
           <AlertTriangle size={48} color={analyzedData.overall_risk === 'High' ? '#ef4444' : '#f59e0b'} style={{ marginBottom: '1rem' }} />
           <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Overall Risk Assessment</h2>
           <div style={{ fontSize: '4rem', fontWeight: 'bold', color: analyzedData.overall_risk === 'High' ? '#ef4444' : '#f59e0b', margin: '1rem 0' }}>
             {analyzedData.score}%
           </div>
           <span className={`badge ${analyzedData.overall_risk.toLowerCase()}`} style={{ fontSize: '1.25rem', padding: '0.5rem 1.5rem' }}>
             {analyzedData.overall_risk} Risk
           </span>
           
           <div className="card mt-8" style={{ width: '100%', maxWidth: '500px' }}>
             <div className="flex-between mb-4">
               <span>Legal</span> <span className={`text-${analyzedData.agents.legal.risk === 'High' ? 'danger' : 'warning'}`}>{analyzedData.agents.legal.risk}</span>
             </div>
             <div className="flex-between mb-4">
               <span>Privacy</span> <span className={`text-${analyzedData.agents.privacy.risk === 'High' ? 'danger' : 'warning'}`}>{analyzedData.agents.privacy.risk}</span>
             </div>
             <div className="flex-between mb-4">
               <span>Finance</span> <span className={`text-${analyzedData.agents.finance.risk === 'High' ? 'danger' : analyzedData.agents.finance.risk === 'Medium' ? 'warning' : 'success'}`}>{analyzedData.agents.finance.risk}</span>
             </div>
             <div className="flex-between">
               <span>Security</span> <span className={`text-${analyzedData.agents.security.risk === 'High' ? 'danger' : analyzedData.agents.security.risk === 'Medium' ? 'warning' : 'success'}`}>{analyzedData.agents.security.risk}</span>
             </div>
           </div>

           <button className="btn btn-primary mt-8" onClick={nextStep}>
            Auto-Fix Risky Clauses <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* STEP 5: Fix Agent */}
      {currentStep === 5 && analyzedData && (
        <div className="step-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <Settings size={32} color="#10b981" />
            <h2 style={{ fontSize: '1.5rem' }}>Fix Agent Rewriting</h2>
          </div>
          <p className="text-muted w-full" style={{ maxWidth: '600px' }}>
            The Fix Agent automatically rewrites risky clauses to ensure fairness and compliance.
          </p>

          <div className="clause-comparison w-full" style={{ maxWidth: '900px' }}>
            <div className="clause-box original">
              <div className="flex-between mb-4">
                <span className="text-danger font-bold" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><AlertTriangle size={16}/> Original Clause</span>
                <span className="badge high">High Risk</span>
              </div>
              <p className="text-muted">"{analyzedData.fix.original}"</p>
            </div>
            
            <div className="clause-box improved">
              <div className="flex-between mb-4">
                <span className="text-success font-bold" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><CheckCircle size={16}/> Improved Clause</span>
                <span className="badge low">Fair</span>
              </div>
              <p className="text-muted">"{analyzedData.fix.improved}"</p>
            </div>
          </div>
          
          <div className="card mt-4 w-full text-left" style={{ maxWidth: '900px', padding: '1rem 1.5rem' }}>
            <strong>Explanation:</strong>
            <p className="text-muted mt-4">{analyzedData.fix.explanation}</p>
          </div>

          <button className="btn btn-primary mt-8" onClick={nextStep}>
            Final Dashboard <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* STEP 6: Dashboard */}
      {currentStep === 6 && analyzedData && (
        <div className="step-container" style={{ minHeight: '70vh', justifyContent: 'flex-start', paddingTop: '2rem' }}>
          <div className="flex-between w-full mb-8">
            <h2 style={{ fontSize: '2rem' }}>Compliance Dashboard</h2>
            <button className="btn btn-primary">
              <Download size={18} /> Download Report
            </button>
          </div>

          <div className="card w-full mb-8 flex-between" style={{ padding: '2rem 3rem' }}>
            <div style={{ textAlign: 'left' }}>
              <h3 className="text-muted">Overall Compliance Score</h3>
              <div style={{ fontSize: '3rem', fontWeight: 'bold', color: analyzedData.score > 80 ? '#10b981' : '#f59e0b', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {analyzedData.score}% <span className={`badge ${analyzedData.score > 80 ? 'low' : 'medium'}`} style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>{analyzedData.score > 80 ? 'Excellent' : 'Needs Review'}</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '2rem' }}>
              {['legal', 'privacy', 'finance', 'security'].map(agent => (
                <div key={agent} style={{ textAlign: 'center' }}>
                  <div className="text-muted mb-4 capitalize" style={{ textTransform: 'capitalize' }}>{agent}</div>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: analyzedData.agents[agent].risk === 'High' ? '#ef4444' : analyzedData.agents[agent].risk === 'Medium' ? '#f59e0b' : '#10b981', margin: '0 auto' }}></div>
                </div>
              ))}
            </div>
          </div>

          <div className="dashboard-grid w-full">
            <div className="stat-card">
              <div className="text-muted">Top Risks</div>
              <div className="stat-value text-danger">
                {Object.values(analyzedData.agents).filter((a: any) => a.risk === 'High').length}
              </div>
            </div>
            <div className="stat-card">
              <div className="text-muted">Fixed Clauses</div>
              <div className="stat-value text-success">1</div>
            </div>
            <div className="stat-card">
              <div className="text-muted">AI Confidence</div>
              <div className="stat-value text-primary">89%</div>
            </div>
            <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <button className="btn btn-outline w-full" style={{ justifyContent: 'center', marginBottom: '0.5rem' }}>View Risk Chart</button>
              <button className="btn btn-outline w-full" style={{ justifyContent: 'center' }}>Agent Timeline</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
