// seedHomeContent.js - Run this script to populate your database with home content
const mongoose = require('mongoose');
require('./db/mongoose'); // Your mongoose connection
const MarkdownSection = require('./models/HomeContent');

const homeContentData = [
  {
    sectionIndex: 0,
    title: "Welcome to ENTYRE",
    type: "text",
    content: `# Transforming End-of-Life Tyres into Valuable Resources

Welcome to the ENTYRE project platform - your comprehensive resource for exploring innovative End-of-Life Tyre (ELT) valorisation pathways in Ireland.

## About the Project

The ENTYRE project focuses on developing sustainable solutions for the approximately 55,000 tonnes of waste tyres generated annually in Ireland. Through cutting-edge research and innovative technologies, we're transforming waste into valuable resources while supporting Ireland's circular economy goals.

**Key Focus Areas:**
- Advanced recycling technologies
- Economic viability assessment  
- Environmental impact analysis
- Policy and regulatory frameworks
- Industry collaboration and implementation

Explore our interactive tools, research findings, and comprehensive pathway analysis to discover how End-of-Life Tyres can become a valuable resource rather than waste.`
  },
  {
    sectionIndex: 1,
    title: "Research Methodology & Approach",
    type: "text", 
    content: `## Our Research Approach

The ENTYRE project employs a comprehensive, multi-disciplinary methodology combining:

### Technical Analysis
- Life Cycle Assessment (LCA) of valorisation pathways
- Techno-economic feasibility studies
- Environmental impact evaluation
- Process optimization and efficiency analysis

### Stakeholder Engagement
- Industry consultation and collaboration
- Policy maker engagement
- Academic research partnerships
- Community impact assessment

### Innovation Framework
- Technology readiness level evaluation
- Market penetration strategies
- Scalability and implementation planning
- Regulatory compliance analysis

### Research Outputs
Our research generates actionable insights through peer-reviewed publications, technical reports, interactive tools, and policy recommendations that drive real-world implementation of sustainable ELT valorisation solutions.`
  },
  {
    sectionIndex: 2,
    title: "Key Statistics & Impact",
    type: "key-value",
    content: JSON.stringify({
      "Annual ELT Generation": "55,000 tonnes in Ireland",
      "Project Duration": "2022-2025", 
      "Research Team": "15+ Experts across multiple disciplines",
      "Valorisation Pathways": "7+ Innovative processing routes examined",
      "Industry Partners": "20+ Companies engaged in research",
      "Environmental Benefit": "Significant CO2 reduction potential",
      "Economic Impact": "Multi-million euro opportunity for Irish economy",
      "Publications": "15+ Peer-reviewed research papers",
      "Technology Readiness": "Pathways at TRL 4-8 development stages",
      "Policy Influence": "Direct input to national waste management strategy"
    }, null, 2)
  },
  {
    sectionIndex: 3,
    title: "Project Partners & Collaboration",
    type: "text",
    content: `## Project Consortium

### Lead Institution
**MaREI Centre, University College Cork**
- Leading sustainable energy research in Ireland
- Expertise in circular economy and waste valorisation
- State-of-the-art research facilities and equipment

### Research Partners
- **Industry Collaborators**: Major tyre manufacturers, waste management companies, and technology providers
- **Academic Partners**: International research institutions and universities
- **Government Agencies**: EPA Ireland, Department of Environment, Climate and Communications
- **EU Networks**: Horizon Europe partners and circular economy initiatives

### Funding & Support
This research is supported by Science Foundation Ireland, EU Horizon Europe programme, and industry co-funding, ensuring robust financial backing for comprehensive research outcomes.

### International Collaboration
ENTYRE maintains active collaboration with international research networks, ensuring our findings contribute to global best practices in End-of-Life Tyre management and circular economy implementation.

**Contact Information:**
For partnership opportunities, research collaboration, or general inquiries about the ENTYRE project, please contact our research team through the University College Cork MaREI Centre.`
  }
];

async function seedHomeContent() {
  try {
    console.log('🌱 Starting home content seeding...');
    
    // Clear existing content (optional - remove this if you want to keep existing data)
    console.log('🗑️  Clearing existing home content...');
    await MarkdownSection.deleteMany({});
    
    // Insert new content
    console.log('📝 Inserting home content sections...');
    for (const contentItem of homeContentData) {
      const section = new MarkdownSection(contentItem);
      await section.save();
      console.log(`✅ Created section ${contentItem.sectionIndex}: ${contentItem.title}`);
    }
    
    console.log('🎉 Home content seeding completed successfully!');
    console.log(`📊 Total sections created: ${homeContentData.length}`);
    
    // Show what was created
    const allSections = await MarkdownSection.find().sort({ sectionIndex: 1 });
    console.log('\n📋 Created sections:');
    allSections.forEach(section => {
      console.log(`   ${section.sectionIndex}. ${section.title} (${section.type})`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding home content:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the seeder
if (require.main === module) {
  seedHomeContent();
}

module.exports = { seedHomeContent, homeContentData };