document.addEventListener('DOMContentLoaded', async () => {
  // Rejestracja rozszerzenia dom-node dla Cytoscape
  if (typeof cytoscapeDomNode !== 'undefined') {
    cytoscape.use(cytoscapeDomNode);
  }

  // Pobranie struktury HTML dla węzła z pliku komponentu
  let wezelTemplateHTML = '';
  try {
    const response = await fetch('../Components/Wezel.html');
    if (response.ok) {
      wezelTemplateHTML = await response.text();
    } else {
      console.error('Nie udało się załadować szablonu Wezel.html');
    }
  } catch (error) {
    console.error('Błąd pobierania szablonu:', error);
  }

  const cy = cytoscape({
    container: document.getElementById('cy'),
    style: [
      {
        selector: 'node',
        style: {
          'shape': 'rectangle',
          'background-opacity': 0, // przezroczyste tło, bo widoczny będzie element DOM
          'width': 150,
          'height': 80
        }
      },
      {
        selector: 'edge',
        style: {
          'width': 3,
          'line-color': '#888',
          'target-arrow-color': '#888',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier'
        }
      }
    ]
  });

  // Inicjalizacja domNode na instancji Cytoscape
  cy.domNode();

  // Funkcja tworząca instancję elementu HTML na podstawie szablonu
  const createCustomNodeElement = (title, content) => {
    const wrapper = document.createElement('div');
    // Ustawiamy szablon pobrany z pliku Wezel.html
    wrapper.innerHTML = wezelTemplateHTML || '<div class="custom-node"><h3 class="node-title"></h3><p class="node-content"></p></div>';

    // Pobieramy pierwszy element z szablonu (np. nasz .custom-node)
    const nodeEl = wrapper.firstElementChild;

    // Uzupełniamy dane
    const titleEl = nodeEl.querySelector('.node-title');
    if (titleEl) titleEl.textContent = title;

    const tagsEl = nodeEl.querySelector('.tags');
    if (tagsEl) tagsEl.textContent = content;

    const contentEl = nodeEl.querySelector('.node-content');
    if (contentEl) contentEl.textContent = content;

    const addNodeEl = nodeEl.querySelector('.add_node');
    if (addNodeEl) addNodeEl.addEventListener('click', () => {
      //TODO: Implementacja dodawania nowego węzła przez fabrykę węzłów i połączeń 
    });

    return nodeEl;
  };



});
