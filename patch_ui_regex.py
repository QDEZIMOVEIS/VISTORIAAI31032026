import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Look for the exact button Excluir Vídeo block and the next {getSafeArray(selectedAppraisal.photos).length > 0 && (
pattern = r'(<button\s*onClick=\{\(\) => handleDeleteAppraisalMedia\(url, \'video\'\)\}[\s\S]*?<\/button>\s*<\/div>\s*\)\)\}\s*<\/div>\s*)\{getSafeArray\(selectedAppraisal\.photos\)\.length > 0 && \('

replacement = r'''\1
              {appraisalVideoUploads.filter(vu => vu.appraisalId === selectedAppraisal.id).length > 0 && (
                <div className="flex flex-col gap-2 mb-4 mt-2">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Uploads de Vídeo ({appraisalVideoUploads.filter(vu => vu.appraisalId === selectedAppraisal.id).length})</h3>
                  {appraisalVideoUploads.filter(vu => vu.appraisalId === selectedAppraisal.id).map(vu => (
                    <div key={vu.id} className="bg-white border border-gray-100 rounded-lg p-3 shadow-sm flex flex-col gap-2 relative overflow-hidden group">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 overflow-hidden flex-1">
                          <Video size={16} className={vu.status === 'success' ? 'text-green-500' : vu.status === 'error' ? 'text-red-500' : 'text-blue-500'} />
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-xs font-bold truncate pr-4">{vu.fileName}</span>
                            <span className="text-[10px] text-gray-400">{(vu.fileSize / (1024 * 1024)).toFixed(1)} MB</span>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {vu.status === 'error' && (
                            <button
                              onClick={() => {
                                setAppraisalVideoUploads(prev => prev.map(v => v.id === vu.id ? { ...v, status: 'waiting', errorMessage: '' } : v));
                                processAppraisalVideoUpload(vu.id, vu.file, vu.fileName, selectedAppraisal.id);
                              }}
                              className="p-1.5 bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100 transition-colors"
                              title="Tentar Novamente"
                            >
                              <RefreshCw size={12} />
                            </button>
                          )}
                          <button
                            onClick={() => setAppraisalVideoUploads(prev => prev.filter(v => v.id !== vu.id))}
                            className="p-1.5 bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors"
                            title="Remover"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      
                      {vu.status === 'uploading' && (
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-blue-500 h-full transition-all duration-300" style={{ width: `${vu.progress}%` }} />
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-[10px] font-medium">
                        {vu.status === 'waiting' && <span className="text-gray-500">Aguardando...</span>}
                        {vu.status === 'uploading' && <span className="text-blue-600">Enviando... {Math.floor(vu.progress)}%</span>}
                        {vu.status === 'success' && <span className="text-green-600">Concluído</span>}
                        {vu.status === 'error' && <span className="text-red-600 truncate max-w-[200px]" title={vu.errorMessage}>{vu.errorMessage}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {getSafeArray(selectedAppraisal.photos).length > 0 && ('''

new_content, count = re.subn(pattern, replacement, content)
print(f"Replaced {count} times")

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)
