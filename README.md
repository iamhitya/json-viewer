# JSON Viewer

A modern, lightweight, and feature-rich JSON viewer and beautifier for viewing, formatting, and validating JSON data in real-time.

**[🚀 Live Demo](https://iamhitya.github.io/json-viewer)**

![Screenshot of the Free QR Code Generator](https://raw.githubusercontent.com/iamhitya/json-viewer/refs/heads/master/public/assets/og_image.png)

## ✨ Features

- ⚡ **Real-time Parsing** - Instant JSON validation and error detection
- 🎯 **Split View** - View editor and preview side-by-side
- 🔀 **Multiple View Modes** - Switch between split, editor-only, and preview-only modes
- 📋 **Format & Compress** - Beautify or minify JSON with one click
- 📋 **Copy to Clipboard** - Easily copy formatted JSON
- 🎲 **Sample Data** - Load sample JSON for quick testing
- ⌨️ **CodeMirror Integration** - Professional syntax highlighting
- 🌳 **Tree View** - Interactive JSON tree visualization

## 📖 Usage

### Basic Usage

1. Paste or type your JSON in the editor pane
2. View the parsed JSON tree in the preview pane
3. Use the toolbar buttons to format, compress, or copy

### View Modes

- **Split** - Editor and preview side-by-side (default)
- **Editor** - Full-width editor mode
- **Preview** - Full-width preview mode

### Toolbar Actions

- **Sample** - Load sample JSON for testing
- **Format** - Pretty-print JSON with 2-space indentation
- **Compress** - Minify JSON to a single line
- **Copy** - Copy formatted JSON to clipboard
- **Clear** - Clear all content

### JSON Validation

The viewer provides real-time JSON validation with clear error messages:
- **Syntax errors** displayed in red
- **Line and column information** for quick debugging
- **Live preview updates** as you type

## 🚀 Quick Start

### Live Demo

Visit [iamhitya.github.io/json-viewer](https://iamhitya.github.io/json-viewer) to use the application online.

### Local Development

```bash
# Clone the repository
git clone https://github.com/iamhitya/json-viewer.git
cd json-viewer

npm install     # Install dependencies
npm start       # Start development server on port 3000
npm run dev     # Alias for npm start
npm run build   # Create optimized production build
npm test        # Run test suite
npm coverage    # Generate coverage report
npm run map     # Analyze bundle size
```

## 📦 Dependencies

- **React 18** - UI framework
- **CodeMirror 6** - Advanced code editor with syntax highlighting
- **@uiw/react-json-view** - JSON tree visualization
- **@uiw/react-split** - Resizable split panes
- **@uiw/react-github-corners** - GitHub corner badge
- **history** - Browser history management

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

To contribute:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📚 References

- [JSON.org](https://www.json.org/json-en.html) - JSON specification
- [RFC 8259](https://tools.ietf.org/html/rfc8259) - JSON text sequences
- [CodeMirror Documentation](https://codemirror.net/)
- [React Documentation](https://react.dev)

## 📝 License

This project is licensed under the [MIT License](LICENSE).

## 👥 Contributors

We appreciate all contributors who help improve this project!

<a href="https://github.com/iamhitya/json-viewer/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=iamhitya/json-viewer" />
</a>

## 🙏 Acknowledgments

Built with ❤️ using React, CodeMirror, and UIW components.
