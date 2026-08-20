const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');

let newContent = content.replace(
  /const \[appraisalVideoUploads, setAppraisalVideoUploads\] = useState<\s*\{\s*id: string;\s*file: File \| Blob;\s*fileName: string;\s*fileSize: number;\s*progress: number;\s*status: 'waiting' \| 'uploading' \| 'success' \| 'error';\s*errorMessage\?: string;\s*\}\[\]>\(\[\]\);/g,
  `const [appraisalVideoUploads, setAppraisalVideoUploads] = useState<{
    id: string;
    appraisalId: string;
    file: File | Blob;
    fileName: string;
    fileSize: number;
    progress: number;
    status: 'waiting' | 'uploading' | 'success' | 'error';
    errorMessage?: string;
  }[]>([]);`
);

newContent = newContent.replace(
  /id: \`video_\$\{Date.now\(\)\}_\$\{Math.random\(\).toString\(36\).substr\(2, 9\)\}\`,\s*file,\s*fileName: rawFileName,/g,
  `id: \`video_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`,
          appraisalId: selectedAppraisal.id,
          file,
          fileName: rawFileName,`
);

newContent = newContent.replace(
  /\{appraisalVideoUploads\.length > 0 && \(/g,
  `{appraisalVideoUploads.filter(vu => vu.appraisalId === selectedAppraisal.id).length > 0 && (`
);

newContent = newContent.replace(
  /\{appraisalVideoUploads\.map\(vu => \(/g,
  `{appraisalVideoUploads.filter(vu => vu.appraisalId === selectedAppraisal.id).map(vu => (`
);

newContent = newContent.replace(
  /Uploads de Vídeo \(\{appraisalVideoUploads\.length\}\)/g,
  `Uploads de Vídeo ({appraisalVideoUploads.filter(vu => vu.appraisalId === selectedAppraisal.id).length})`
);

fs.writeFileSync('src/App.tsx', newContent);
