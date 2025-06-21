// Test script for enhanced section detection
const axios = require('axios');

// Sample academic paper text with proper sections
const samplePaperText = `
1. Introduction

Sparse autoencoders (SAEs) are designed to extract interpretable features from language models by enforcing a sparsity constraint. Ideally, training an SAE would yield latents that are both sparse and semantically meaningful. However, many SAE latents activate frequently (i.e., are dense), raising concerns that they may be undesirable artifacts of the training procedure.

2. Related Work

Previous work on sparse autoencoders has focused primarily on achieving sparsity through various regularization techniques. The relationship between sparsity and interpretability has been extensively studied in the context of feature learning.

3. Methodology

We systematically investigate the geometry, function, and origin of dense latents and show that they are not only persistent but often reflect meaningful model representations. We first demonstrate that dense latents tend to form antipodal pairs that reconstruct specific directions in the residual stream.

4. Experimental Setup

Our experiments are conducted on a variety of language models including GPT-2, BERT, and RoBERTa. We use standard evaluation metrics to assess the quality of extracted features.

5. Results

The results show that dense latents serve functional roles in language model computation and should not be dismissed as training noise. We observe consistent patterns across different model architectures.

6. Discussion

Our findings indicate that the traditional focus on sparsity may be misguided. Dense latents often contain valuable information about model behavior and should be studied in their own right.

7. Conclusion

In conclusion, we have demonstrated that dense SAE latents are features, not bugs. They play important functional roles in language model computation and should be studied systematically.

References

[1] Previous work on sparse autoencoders
[2] Studies on interpretability in neural networks
[3] Analysis of language model representations
`;

// Test the section detection function
function createBetterSections(text) {
  // Enhanced section detection patterns for academic papers
  const sectionPatterns = [
    // Numbered sections (1. Introduction, 2. Related Work, etc.)
    /\n\s*(\d+\.\s*[A-Z][^.\n]*?)(?=\n|$)/g,
    // Roman numerals (I. Introduction, II. Related Work, etc.)
    /\n\s*([IVX]+\.\s*[A-Z][^.\n]*?)(?=\n|$)/g,
    // Common academic section headers
    /\n\s*(Abstract|Introduction|Related Work|Methodology|Methods|Experimental Setup|Experiments|Results|Discussion|Conclusion|References|Bibliography|Appendix|Acknowledgments?)(?=\n|$)/gi,
    // ALL CAPS headers
    /\n\s*([A-Z][A-Z\s]{3,})(?=\n|$)/g,
    // Title case headers with potential numbering
    /\n\s*([A-Z][a-z\s]+(?:[0-9]+)?)(?=\n|$)/g
  ];
  
  let sections = [];
  let currentText = text;
  
  // Collect all potential section markers
  let markers = [];
  
  for (const pattern of sectionPatterns) {
    // Use exec instead of matchAll for compatibility
    let match;
    while ((match = pattern.exec(currentText)) !== null) {
      markers.push({
        index: match.index,
        title: match[1] || match[0],
        pattern: pattern.source
      });
    }
  }
  
  // Sort markers by position
  markers.sort((a, b) => a.index - b.index);
  
  // Remove duplicates and overlapping markers
  markers = markers.filter((marker, index) => {
    if (index === 0) return true;
    const prevMarker = markers[index - 1];
    return marker.index > prevMarker.index + 50; // Minimum distance between sections
  });
  
  // Create sections from markers
  if (markers.length > 1) {
    for (let i = 0; i < markers.length; i++) {
      const start = markers[i].index;
      const end = i < markers.length - 1 ? markers[i + 1].index : currentText.length;
      const sectionContent = currentText.substring(start, end).trim();
      
      if (sectionContent.length > 100) { // Minimum section length
        const title = markers[i].title.trim();
        sections.push({
          title: title,
          content: sectionContent,
          index: i + 1
        });
      }
    }
  }
  
  // Clean up section content
  sections = sections.map(section => ({
    ...section,
    content: section.content.replace(/\n\s*\n\s*\n/g, '\n\n').replace(/\s+/g, ' ').trim(),
    wordCount: section.content.split(/\s+/).length
  }));
  
  return sections;
}

// Test the function
console.log('Testing enhanced section detection...\n');
const sections = createBetterSections(samplePaperText);

console.log(`Found ${sections.length} sections:\n`);
sections.forEach((section, index) => {
  console.log(`${index + 1}. ${section.title}`);
  console.log(`   Words: ${section.wordCount}`);
  console.log(`   Content preview: ${section.content.substring(0, 100)}...`);
  console.log('');
});

// Test with the server
async function testServerExtraction() {
  try {
    console.log('Testing server extraction...\n');
    
    const response = await axios.post('http://localhost:3000/api/extract-enhanced', {
      paper: {
        id: "test-123",
        title: "Test Paper with Sections",
        authors: "Test Author",
        published: "2025-06-20",
        summary: samplePaperText,
        pdfUrl: "https://arxiv.org/pdf/test.pdf",
        category: "cs.AI"
      }
    });
    
    if (response.data.success) {
      console.log('Server extraction successful!');
      console.log(`Full text length: ${response.data.content.fullText.length}`);
      console.log(`Number of sections: ${response.data.content.sections.length}`);
      console.log(`Source: ${response.data.content.source}`);
      
      response.data.content.sections.forEach((section, index) => {
        console.log(`\nSection ${index + 1}: ${section.title}`);
        console.log(`Words: ${section.wordCount}`);
      });
    } else {
      console.log('Server extraction failed:', response.data.error);
    }
  } catch (error) {
    console.log('Server test failed:', error.message);
  }
}

// Run tests
testServerExtraction(); 