export const TEXT_CONTENT = `
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse consequat non justo eget auctor. Donec blandit diam id magna iaculis, id bibendum tellus ultrices. Pellentesque sit amet pulvinar est, sit amet ultrices orci. In hac habitasse platea dictumst. Aliquam at maximus massa. Sed rhoncus molestie accumsan. Nunc venenatis semper neque, in feugiat est semper ac.
Nullam in aliquet nisl. Duis venenatis rutrum arcu vel tincidunt. Duis aliquet placerat suscipit. Sed neque magna, tristique at metus eget, maximus egestas tortor. Nam ultricies semper felis, vitae tincidunt ipsum lacinia sed. Nam molestie nisi in purus varius gravida. Cras efficitur molestie hendrerit.
Praesent gravida quam purus, sit amet cursus lectus varius at. Morbi laoreet bibendum nisl, ac condimentum purus lacinia vel. Duis imperdiet lacinia accumsan. Sed interdum tellus nec risus ullamcorper laoreet. Curabitur tellus libero, auctor vitae pharetra quis, accumsan vel neque. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Cras facilisis, mi et facilisis pharetra, mi arcu congue ligula, a sollicitudin nisi elit sed nibh. Praesent sit amet ligula sed lectus hendrerit sodales non nec nisl. Cras lacinia ante congue nulla hendrerit auctor.
Sed ac volutpat est. Cras efficitur dignissim odio eget posuere. Nam non pharetra ante, ac egestas lacus. Morbi lacinia commodo libero at mollis. Ut sed mattis purus. Vivamus in arcu sapien. Sed sed varius est. Sed aliquam, felis a tristique porta, lacus ligula molestie sem, a posuere sapien est sed dui. Vivamus pretium ipsum eget libero tempor posuere. Pellentesque vulputate eu felis eget aliquet. Suspendisse facilisis felis ex, nec pulvinar leo varius at. Phasellus ultrices libero in ex congue, ut fermentum justo tincidunt. Quisque a erat sem. Vestibulum sed commodo dolor, sodales eleifend sem.
Aliquam est nisi, sodales a aliquam in, ullamcorper id turpis. Donec vehicula elementum nisi a luctus. Integer porta turpis ante, eu vehicula eros commodo a. Vivamus odio sapien, aliquet sed velit semper, facilisis finibus purus. Morbi ut sapien dictum, imperdiet magna sit amet, consectetur risus. Duis at volutpat tellus. Proin mauris risus, finibus id lacinia ut, aliquet sed sem. Aenean consectetur mi nisl, nec laoreet orci euismod vitae. Vestibulum purus eros, mollis sed feugiat id, consequat lobortis risus. Nam congue ligula erat, sit amet laoreet lectus euismod ut.
`;

export const TEXT_METADATA = {
  title: 'Unknown Document',
  author: 'Unknown',
};

export const TEXT_TITLE_ELEMENT = {
  title: "Lorem Ipsum",
  subtitle: `"Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit..."`,
  t1: `"There is no one who loves pain itself, who seeks after it and wants to have it, simply because it is pain..."`,
  t2: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse consequat non justo eget auctor. Donec blandit diam id magna iaculis, id bibendum tellus ultrices. Pellentesque sit amet pulvinar est, sit amet ultrices orci. In hac habitasse platea dictumst. Aliquam at maximus massa. Sed rhoncus molestie accumsan. Nunc venenatis semper neque, in feugiat est semper ac.",
  t3: "Nullam in aliquet nisl. Duis venenatis rutrum arcu vel tincidunt. Duis aliquet placerat suscipit. Sed neque magna, tristique at metus eget, maximus egestas tortor. Nam ultricies semper felis, vitae tincidunt ipsum lacinia sed. Nam molestie nisi in purus varius gravida. Cras efficitur molestie hendrerit.",
  t4: "Praesent gravida quam purus, sit amet cursus lectus varius at. Morbi laoreet bibendum nisl, ac condimentum purus lacinia vel. Duis imperdiet lacinia accumsan. Sed interdum tellus nec risus ullamcorper laoreet. Curabitur tellus libero, auctor vitae pharetra quis, accumsan vel neque",
  t5: "Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Cras facilisis, mi et facilisis pharetra, mi arcu congue ligula, a sollicitudin nisi elit sed nibh. Praesent sit amet ligula sed lectus hendrerit sodales non nec nisl. Cras lacinia ante congue nulla hendrerit auctor.",
  t6: "Sed ac volutpat est. Cras efficitur dignissim odio eget posuere. Nam non pharetra ante, ac egestas lacus. Morbi lacinia commodo libero at mollis. Ut sed mattis purus. Vivamus in arcu sapien. Sed sed varius est. Sed aliquam, felis a tristique porta, lacus ligula molestie sem, a posuere sapien est sed dui. Vivamus pretium ipsum eget libero tempor posuere. Pellentesque vulputate eu felis eget aliquet. Suspendisse facilisis felis ex, nec pulvinar leo varius at. Phasellus ultrices libero in ex congue, ut fermentum justo tincidunt. Quisque a erat sem. Vestibulum sed commodo dolor, sodales eleifend sem.",
  text: "Aliquam est nisi, sodales a aliquam in, ullamcorper id turpis. Donec vehicula elementum nisi a luctus. Integer porta turpis ante, eu vehicula eros commodo a. Vivamus odio sapien, aliquet sed velit semper, facilisis finibus purus. Morbi ut sapien dictum, imperdiet magna sit amet, consectetur risus. Duis at volutpat tellus. Proin mauris risus, finibus id lacinia ut, aliquet sed sem. Aenean consectetur mi nisl, nec laoreet orci euismod vitae. Vestibulum purus eros, mollis sed feugiat id, consequat lobortis risus. Nam congue ligula erat, sit amet laoreet lectus euismod ut."
}

export const TABLE_ELEMENT = {
  table: [
    {
      row: [
        {
          coluns: ["a", "b", "c"],
        },
        {
          coluns: ["foo", "bar", "baz"],
        },
        {
          coluns: [1, 2, 3],
        }
      ]
    }
  ]
}

export const LIST_ELEMENT = {
  lists: [
    {
      type: "numbered",
      title: "numbers",
      items: ["one", "two", "three", "four"]
    },
    {
      type: "bulleted",
      title: "dots",
      items: ["a", "b", "c", "d"]
    },
    {
      type: "checked",
      title: "checks",
      items: [
        { text: "foo", checked: true },
        { text: "bar", checked: false },
        { text: "baz", checked: false }
      ]
    }
  ]
}

export const PAGE_ELEMENTS = {
  header: {
    text: "Lorem Ipsum PAGE",
    hasPageNumber: true, // PAGE field detected
    // watermark: "LI" // Watermark detection needs more complex parsing
  },
  footer: {
    text: "Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit"
  },
  footnotes: [
    {
      id: "0",
      text: "Lorem ipsum dolor sit amet."
    }
  ],
  pageCount: 1, // Single page document
  content: {
    paragraphs: 5, // Number of main content paragraphs
    hasWatermark: true // Watermark exists but complex to extract
  }
}
