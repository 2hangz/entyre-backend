const sectionSchema = {
    text: {
      label: "Text Section",
      fields: [
        { key: "body", label: "Text Content", type: "textarea" }
      ]
    },
    highlight: {
      label: "Highlight Section",
      fields: [
        { key: "number", label: "Highlight Number", type: "text" },
        { key: "label", label: "Label", type: "text" },
        { key: "description", label: "Description", type: "textarea" }
      ]
    },
    hero: {
      label: "Hero Section",
      fields: [
        { key: "title", label: "Hero Title", type: "text" },
        { key: "subtitle", label: "Hero Subtitle", type: "textarea" },
        { key: "buttonText", label: "Button Text", type: "text" },
        { key: "buttonLink", label: "Button Link", type: "url" }
      ]
    },
    card: {
      label: "Card Section",
      fields: [
        { key: "content", label: "Card Content", type: "textarea" },
        { key: "cardButtonText", label: "Button Text", type: "text" },
        { key: "cardButtonLink", label: "Button Link", type: "url" }
      ]
    },
    image: {
      label: "Image Section",
      fields: [
        { key: "url", label: "Image URL", type: "url" },
        { key: "caption", label: "Caption", type: "text" }
      ]
    }
  };
  
  export default sectionSchema;  