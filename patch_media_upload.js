const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /const handleAppraisalMediaUpload = async \([^)]*\) => \{[\s\S]*?(?=\s+const handleDeleteAppraisalMedia)/;

const newCode = `const processAppraisalVideoUpload = async (uploadId: string, file: File | Blob, rawFileName: string, appraisalId: string) => {
    try {
      setAppraisalVideoUploads(prev => prev.map(vu => vu.id === uploadId ? { ...vu, status: 'uploading', progress: 0 } : vu));

      const sanitizedName = rawFileName.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
      const storagePath = \`appraisals/\${appraisalId}/\${Date.now()}_\${sanitizedName}\`;
      const storageRef = ref(storage, storagePath);

      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setAppraisalVideoUploads(prev => prev.map(vu => vu.id === uploadId ? { ...vu, progress } : vu));
        },
        (error) => {
          console.error("[Video Upload] Erro no uploadTask:", error);
          setAppraisalVideoUploads(prev => prev.map(vu => vu.id === uploadId ? { ...vu, status: 'error', errorMessage: 'Ocorreu um erro ao carregar este vídeo. ' + error.message } : vu));
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            await updateDoc(doc(db, 'appraisals', appraisalId), {
              videos: arrayUnion(url)
            });
            // Update local state for success
            setAppraisalVideoUploads(prev => prev.map(vu => vu.id === uploadId ? { ...vu, status: 'success', progress: 100 } : vu));
            
            // Auto refresh selected appraisal if it's the currently active one
            const updatedSnap = await getDoc(doc(db, 'appraisals', appraisalId));
            if (updatedSnap.exists()) {
              const updatedData = { id: updatedSnap.id, ...updatedSnap.data() } as Appraisal;
              setSelectedAppraisal(prev => prev?.id === appraisalId ? updatedData : prev);
              setAppraisals(prevApp => prevApp.map(app => app.id === appraisalId ? updatedData : app));
            }
          } catch (err: any) {
            console.error("[Video Upload] Erro ao salvar URL ou atualizar documento:", err);
            setAppraisalVideoUploads(prev => prev.map(vu => vu.id === uploadId ? { ...vu, status: 'error', errorMessage: 'Ocorreu um erro ao salvar o vídeo no banco de dados. ' + err.message } : vu));
          }
        }
      );
    } catch (error: any) {
      console.error("[Video Upload] Catch Block:", error);
      setAppraisalVideoUploads(prev => prev.map(vu => vu.id === uploadId ? { ...vu, status: 'error', errorMessage: 'Ocorreu um erro inesperado ao carregar este vídeo.' } : vu));
    }
  };

  const handleAppraisalMediaUpload = async (e: React.ChangeEvent<HTMLInputElement> | Blob, type?: 'photo' | 'video') => {
    if (!selectedAppraisal) return;
    
    let files: (File | Blob)[] = [];
    if (e instanceof Blob) {
      files = [e];
    } else if (e && e.target && 'files' in e.target && e.target.files) {
      files = Array.from(e.target.files);
    }
    if (files.length === 0) return;
    
    const photosToUpload: (File | Blob)[] = [];
    const videosToUpload: (File | Blob)[] = [];
    
    for (const file of files) {
      const isVideo = type === 'video' || (file instanceof File && file.type.startsWith('video/')) || (file instanceof File && file.name.toLowerCase().match(/\\.(mp4|mov|webm|avi|mkv)$/));
      if (isVideo) {
        videosToUpload.push(file);
      } else {
        photosToUpload.push(file);
      }
    }
    
    if (videosToUpload.length > 0) {
      const validVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'];
      const maxVideoSize = 250 * 1024 * 1024; // 250MB
      
      const newVideoUploads = videosToUpload.map(file => {
        const rawFileName = file instanceof File ? file.name : \`capture_\${Date.now()}.webm\`;
        const fileSize = file instanceof File ? file.size : file.size;
        
        // Simple type check fallback based on extension if type is empty
        const ext = rawFileName.split('.').pop()?.toLowerCase();
        const isTypeValid = file instanceof File ? (validVideoTypes.includes(file.type.toLowerCase()) || ['mp4', 'mov', 'webm'].includes(ext || '')) : true;
        
        let initialStatus: 'waiting' | 'error' = 'waiting';
        let errorMsg = '';
        
        if (file instanceof File && !isTypeValid) {
          initialStatus = 'error';
          errorMsg = 'Formato de vídeo não permitido. Envie arquivos MP4, MOV ou WEBM.';
        } else if (fileSize > maxVideoSize) {
          initialStatus = 'error';
          errorMsg = 'Este vídeo é muito grande. Reduza o tamanho do arquivo e tente novamente.';
        }
        
        return {
          id: \`video_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`,
          file,
          fileName: rawFileName,
          fileSize,
          progress: 0,
          status: initialStatus as any,
          errorMessage: errorMsg
        };
      });
      
      setAppraisalVideoUploads(prev => [...prev, ...newVideoUploads]);
      
      newVideoUploads.forEach(vu => {
        if (vu.status === 'waiting') {
          processAppraisalVideoUpload(vu.id, vu.file, vu.fileName, selectedAppraisal.id);
        }
      });
    }
    
    if (photosToUpload.length === 0) return;
    
    setLoading(true);
    setReportProgress(5);
    setProgressMessage('Iniciando envio de arquivos...');
    try {
      let currentFile = 0;
      const totalFiles = photosToUpload.length;
      for (const file of photosToUpload) {
        currentFile++;
        const baseProgress = 5 + Math.floor(((currentFile - 1) / totalFiles) * 85);
        setReportProgress(baseProgress);
        
        setProgressMessage(\`Processando foto \${currentFile} de \${totalFiles}...\`);
        
        let fileToUpload: File | Blob = file;
        if (file instanceof File) {
          setProgressMessage(\`Otimizando foto \${currentFile} de \${totalFiles}...\`);
          fileToUpload = await compressImageSafely(file);
        }
        
        const rawFileName = file instanceof File ? file.name : \`capture_\${Date.now()}.jpg\`;
        const sanitizedName = rawFileName.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
        const storagePath = \`appraisals/\${selectedAppraisal.id}/\${Date.now()}_\${sanitizedName}\`;
        const storageRef = ref(storage, storagePath);
        
        setProgressMessage(\`Enviando \${currentFile} de \${totalFiles}...\`);
        await uploadBytes(storageRef, fileToUpload);
        
        setReportProgress(baseProgress + Math.floor(85 / totalFiles / 2));
        setProgressMessage(\`Finalizando \${currentFile} de \${totalFiles}...\`);
        const url = await getDownloadURL(storageRef);
        
        await updateDoc(doc(db, 'appraisals', selectedAppraisal.id), {
          photos: arrayUnion(url)
        });
      }
      
      setReportProgress(95);
      setProgressMessage('Atualizando dados do parecer...');
      const updatedSnap = await getDoc(doc(db, 'appraisals', selectedAppraisal.id));
      if (updatedSnap.exists()) {
        const updatedData = { id: updatedSnap.id, ...updatedSnap.data() } as Appraisal;
        setSelectedAppraisal(updatedData);
        setAppraisals(prev => prev.map(app => app.id === selectedAppraisal.id ? updatedData : app));
      }
      setReportProgress(100);
      setProgressMessage('Arquivos enviados com sucesso!');
      setTimeout(() => {
        setReportProgress(0);
        setProgressMessage('');
      }, 1500);
    } catch (error: any) {
      console.error("Error uploading appraisal media:", error);
      setReportProgress(0);
      setProgressMessage('');
      let errorMsg = "Erro ao enviar mídia.";
      if (error.code === 'storage/unauthorized') {
        errorMsg += " Sem permissão no Firebase Storage.";
      }
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  }`;

fs.writeFileSync('src/App.tsx', content.replace(regex, newCode));
