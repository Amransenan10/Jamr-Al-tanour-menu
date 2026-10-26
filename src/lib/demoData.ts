import { Category, Product, Story, OptionGroup, OptionItem, Coupon, StoreSettings } from '../types';

export const MITHAQ_CATEGORIES: Category[] = [
  {
    id: 'cat_burgers',
    name_ar: 'برجر وساندوتشات فاخرة',
    name_en: 'Burgers & Sandwiches',
    is_active: true,
    sort_order: 1,
    display_order: 1,
    description_ar: 'محضرة من أجود أنواع اللحوم والدجاج الطازج'
  },
  {
    id: 'cat_pizza',
    name_ar: 'بيتزا وفطائر إيطالية',
    name_en: 'Pizza & Italian Pies',
    is_active: true,
    sort_order: 2,
    display_order: 2,
    description_ar: 'عجينة طازجة مخبوزة على الحجر بألذ الأجبان'
  },
  {
    id: 'cat_shawarma',
    name_ar: 'شاورما ومشويات',
    name_en: 'Shawarma & Grills',
    is_active: true,
    sort_order: 3,
    display_order: 3,
    description_ar: 'نكهة أصيلة متبلة بخلطات مذاق الخاصة'
  },
  {
    id: 'cat_appetizers',
    name_ar: 'مقبلات ووجبات خفيفة',
    name_en: 'Appetizers & Sides',
    is_active: true,
    sort_order: 4,
    display_order: 4,
    description_ar: 'مقبلات ساخنة ومقرمشة تكمل وجبتك'
  },
  {
    id: 'cat_beverages',
    name_ar: 'عصائر طبيعية ومشروبات',
    name_en: 'Beverages & Fresh Juices',
    is_active: true,
    sort_order: 5,
    display_order: 5,
    description_ar: 'عصائر فريش 100% ومشروبات منعشة'
  },
  {
    id: 'cat_desserts',
    name_ar: 'حلويات وسويت',
    name_en: 'Desserts & Sweets',
    is_active: true,
    sort_order: 6,
    display_order: 6,
    description_ar: 'أشهى الحلويات لختام وجبة مثالية'
  }
];

export const MITHAQ_PRODUCTS: (Product & { option_groups?: (OptionGroup & { option_items: OptionItem[] })[] })[] = [
  // --- Burgers ---
  {
    id: 'prod_b1',
    category_id: 'cat_burgers',
    name_ar: 'برجر مذاق الكلاسيكي الفاخر',
    name_en: 'MITHAQ Classic Burger',
    description_ar: 'شريحة لحم بلاك أنجوس مشوية مع جبنة الشيدر الذائبة، مخلل، خس، وصوص مذاق السري في خبز بريوش طازج.',
    description_en: 'Grilled Black Angus beef, melted cheddar, pickles, lettuce, and secret MITHAQ sauce in a brioche bun.',
    price: 26,
    original_price: 32,
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    is_offer: true,
    calories: 620,
    sales_count: 142,
    option_groups: [
      {
        id: 'grp_b1_size',
        product_id: 'prod_b1',
        name_ar: 'الحجم وعدد الشرائح',
        name_en: 'Size & Patties',
        min_selection: 1,
        max_selection: 1,
        option_items: [
          { id: 'item_b1_single', group_id: 'grp_b1_size', name_ar: 'سنجل (شريحة واحدة)', name_en: 'Single', price: 0, is_available: true, calories: 620 },
          { id: 'item_b1_double', group_id: 'grp_b1_size', name_ar: 'دبل (شريحتين)', name_en: 'Double', price: 9, is_available: true, calories: 880 },
          { id: 'item_b1_triple', group_id: 'grp_b1_size', name_ar: 'تربل (3 شرائح)', name_en: 'Triple', price: 16, is_available: true, calories: 1120 }
        ]
      },
      {
        id: 'grp_b1_adds',
        product_id: 'prod_b1',
        name_ar: 'إضافات مميزة',
        name_en: 'Add-ons',
        min_selection: 0,
        max_selection: 4,
        option_items: [
          { id: 'item_b1_cheese', group_id: 'grp_b1_adds', name_ar: 'شريحة جبن إضافية', name_en: 'Extra Cheese', price: 3, is_available: true, calories: 80 },
          { id: 'item_b1_bacon', group_id: 'grp_b1_adds', name_ar: 'شرائح بيف بيكون مدخن', name_en: 'Beef Bacon', price: 5, is_available: true, calories: 110 },
          { id: 'item_b1_jalapeno', group_id: 'grp_b1_adds', name_ar: 'هالبينو حار', name_en: 'Jalapenos', price: 2, is_available: true, calories: 15 },
          { id: 'item_b1_mushrooms', group_id: 'grp_b1_adds', name_ar: 'فطر مكرمل مشوي', name_en: 'Grilled Mushrooms', price: 4, is_available: true, calories: 45 }
        ]
      }
    ]
  },
  {
    id: 'prod_b2',
    category_id: 'cat_burgers',
    name_ar: 'دبل سموكد باربيكيو برجر',
    name_en: 'Double Smoked BBQ Burger',
    description_ar: 'شريحتان لحم مشوي على اللهب مع بصل مقرمش، صوص الباربيكيو المدخن وجبنة شيدر معتقة.',
    description_en: 'Two flame-grilled beef patties with crispy onions, smoky BBQ sauce and aged cheddar.',
    price: 34,
    original_price: null,
    image_url: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    calories: 790,
    sales_count: 98,
    option_groups: [
      {
        id: 'grp_b2_bread',
        product_id: 'prod_b2',
        name_ar: 'نوع الخبز',
        name_en: 'Bread Type',
        min_selection: 1,
        max_selection: 1,
        option_items: [
          { id: 'item_b2_brioche', group_id: 'grp_b2_bread', name_ar: 'خبز بريوش زبدة', name_en: 'Butter Brioche', price: 0, is_available: true, calories: 180 },
          { id: 'item_b2_potato', group_id: 'grp_b2_bread', name_ar: 'خبز البطاطس الطري', name_en: 'Potato Bun', price: 0, is_available: true, calories: 170 }
        ]
      }
    ]
  },
  {
    id: 'prod_b3',
    category_id: 'cat_burgers',
    name_ar: 'كرسبي تشيكن سبايسي زنجر',
    name_en: 'Spicy Crispy Chicken',
    description_ar: 'قطعة صدر دجاج مقرمشة بتتبيلة حارة خاصة مع سلطة الكولسلو الأمريكية وصوص المايونيز بالثوم.',
    description_en: 'Crispy seasoned spicy chicken breast with American coleslaw and garlic mayo.',
    price: 23,
    original_price: 28,
    image_url: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    is_offer: true,
    calories: 580,
    sales_count: 185
  },
  {
    id: 'prod_b4',
    category_id: 'cat_burgers',
    name_ar: 'ساندوتش فاهيتا دجاج مكسيكي',
    name_en: 'Mexican Chicken Fajita',
    description_ar: 'قطع دجاج متبلة مشوية مع الفلفل الرومي الملون والبصل وجبنة الموزاريلا في خبز الفينو الفاخر.',
    description_en: 'Marinated grilled chicken with bell peppers, onions, and melted mozzarella.',
    price: 19,
    original_price: null,
    image_url: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    calories: 460,
    sales_count: 67
  },

  // --- Pizza & Pies ---
  {
    id: 'prod_p1',
    category_id: 'cat_pizza',
    name_ar: 'بيتزا مارجريتا نابولي الإيطالية',
    name_en: 'Neapolitan Margherita Pizza',
    description_ar: 'صلصة طماطم سان مارزانو، جبنة موزاريلا إيطالية نقية، أوراق ريحان طازجة وزيت زيتون بكر.',
    description_en: 'San Marzano tomato sauce, pure Italian mozzarella, fresh basil and extra virgin olive oil.',
    price: 29,
    original_price: 36,
    image_url: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    is_offer: true,
    calories: 780,
    sales_count: 120,
    option_groups: [
      {
        id: 'grp_p1_size',
        product_id: 'prod_p1',
        name_ar: 'حجم البيتزا',
        name_en: 'Pizza Size',
        min_selection: 1,
        max_selection: 1,
        option_items: [
          { id: 'item_p1_m', group_id: 'grp_p1_size', name_ar: 'وسط (Medium - 6 قطع)', name_en: 'Medium (6 slices)', price: 0, is_available: true, calories: 780 },
          { id: 'item_p1_l', group_id: 'grp_p1_size', name_ar: 'كبير (Large - 8 قطع)', name_en: 'Large (8 slices)', price: 10, is_available: true, calories: 1100 }
        ]
      },
      {
        id: 'grp_p1_crust',
        product_id: 'prod_p1',
        name_ar: 'نوع الأطراف',
        name_en: 'Crust Style',
        min_selection: 0,
        max_selection: 1,
        option_items: [
          { id: 'item_p1_stuffed', group_id: 'grp_p1_crust', name_ar: 'أطراف محشوة جبنة موزاريلا', name_en: 'Stuffed Crust', price: 6, is_available: true, calories: 150 }
        ]
      }
    ]
  },
  {
    id: 'prod_p2',
    category_id: 'cat_pizza',
    name_ar: 'بيتزا بيبروني فاخرة',
    name_en: 'Premium Pepperoni Pizza',
    description_ar: 'طبقات سخية من شرائح البيبروني البقري مع جبنة الموزاريلا الغنية وصلصة الطماطم الخاصة.',
    description_en: 'Generous layers of beef pepperoni, rich mozzarella, and special pizza sauce.',
    price: 35,
    original_price: null,
    image_url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    calories: 940,
    sales_count: 210
  },
  {
    id: 'prod_p3',
    category_id: 'cat_pizza',
    name_ar: 'بيتزا دجاج باربيكيو ورانش',
    name_en: 'BBQ Chicken Ranch Pizza',
    description_ar: 'دجاج متبل مشوي مع صوص الباربيكيو الغني وصلصة الرانش اللذيذة وبصل أحمر.',
    description_en: 'Marinated grilled chicken with smoky BBQ, creamy ranch, and red onions.',
    price: 36,
    original_price: 42,
    image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    is_offer: true,
    calories: 890,
    sales_count: 175
  },
  {
    id: 'prod_p4',
    category_id: 'cat_pizza',
    name_ar: 'فطيرة أجبان مشكلة مقرمشة',
    name_en: 'Four Cheese Crispy Pie',
    description_ar: 'مزيج شهي من جبنة القشقوان والموزاريلا والشيدر والحلوم على عجينة رقيقة مقرمشة.',
    description_en: 'Delicious blend of Kashkaval, Mozzarella, Cheddar, and Halloumi on a crispy crust.',
    price: 18,
    original_price: null,
    image_url: 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    calories: 490,
    sales_count: 82
  },

  // --- Shawarma & Grills ---
  {
    id: 'prod_s1',
    category_id: 'cat_shawarma',
    name_ar: 'صحن شاورما عربي مذاق سبيشال',
    name_en: 'MITHAQ Special Arabic Shawarma',
    description_ar: 'شاورما دجاج مقطعة في خبز الصاج تقدم مع بطاطس مقلية ذهبية، صوص ثوم، صوص حار ومخلل.',
    description_en: 'Sliced chicken shawarma in saj bread, served with golden fries, garlic sauce, hot sauce, and pickles.',
    price: 22,
    original_price: 26,
    image_url: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    is_offer: true,
    calories: 720,
    sales_count: 260,
    option_groups: [
      {
        id: 'grp_s1_type',
        product_id: 'prod_s1',
        name_ar: 'نوع اللحم',
        name_en: 'Meat Selection',
        min_selection: 1,
        max_selection: 1,
        option_items: [
          { id: 'item_s1_chk', group_id: 'grp_s1_type', name_ar: 'دجاج متبل على السيخ', name_en: 'Chicken', price: 0, is_available: true, calories: 720 },
          { id: 'item_s1_meat', group_id: 'grp_s1_type', name_ar: 'لحم عجل بلدي طازج', name_en: 'Beef', price: 4, is_available: true, calories: 780 }
        ]
      }
    ]
  },
  {
    id: 'prod_s2',
    category_id: 'cat_shawarma',
    name_ar: 'صاروخ شاورما صاج بالجبنة',
    name_en: 'Cheesy Jumbo Saj Shawarma',
    description_ar: 'شاورما دجاج محشوة في رغيف صاج كبير مع جبنة موزاريلا ذائبة ومحمصة على الجريل.',
    description_en: 'Jumbo saj wrap stuffed with chicken shawarma and melted mozzarella, toasted to perfection.',
    price: 17,
    original_price: null,
    image_url: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    calories: 640,
    sales_count: 140
  },
  {
    id: 'prod_s3',
    category_id: 'cat_shawarma',
    name_ar: 'صحن كباب لحم مشوي على الفحم',
    name_en: 'Charcoal Grilled Meat Kebab',
    description_ar: 'أسياخ كباب لحم بلدي متبل مع الخضار المشوية، بصل وسماق، وخبز تنور ساخن.',
    description_en: 'Skewers of grilled spiced minced lamb served with grilled vegetables, sumac onions, and hot bread.',
    price: 38,
    original_price: 45,
    image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    is_offer: true,
    calories: 680,
    sales_count: 95
  },

  // --- Appetizers & Sides ---
  {
    id: 'prod_a1',
    category_id: 'cat_appetizers',
    name_ar: 'أصابع جبنة الموزاريلا المقرمشة (5 حبات)',
    name_en: 'Crispy Mozzarella Sticks (5 pcs)',
    description_ar: 'أصابع موزاريلا ذهبية مقرمشة تقدم ساخنة مع صوص المارينارا الإيطالي اللذيذ.',
    description_en: 'Golden crispy mozzarella sticks served hot with marinara dipping sauce.',
    price: 16,
    original_price: null,
    image_url: 'https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    calories: 380,
    sales_count: 110
  },
  {
    id: 'prod_a2',
    category_id: 'cat_appetizers',
    name_ar: 'بطاطس مقلية مع الجبن والهلابينو',
    name_en: 'Cheesy Jalapeno Loaded Fries',
    description_ar: 'بطاطس مقلية ذهبية مغطاة بصلصة الجبن الذائبة، قطع الهالبينو، ورشة بهارات خاصة.',
    description_en: 'Golden fries loaded with warm melted cheese, jalapeno slices, and signature spices.',
    price: 15,
    original_price: 18,
    image_url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    is_offer: true,
    calories: 520,
    sales_count: 195
  },
  {
    id: 'prod_a3',
    category_id: 'cat_appetizers',
    name_ar: 'حلقات بصل مقرمشة (8 حبات)',
    name_en: 'Crispy Onion Rings (8 pcs)',
    description_ar: 'حلقات بصل طازجة مغلفة بخلطة مقرمشة ذهبية تقدم مع صوص الرانش.',
    description_en: 'Fresh onion rings in a crunchy golden batter served with ranch sauce.',
    price: 12,
    original_price: null,
    image_url: 'https://images.unsplash.com/photo-1639024471287-032f6644dd40?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    calories: 310,
    sales_count: 76
  },
  {
    id: 'prod_a4',
    category_id: 'cat_appetizers',
    name_ar: 'سلطة سيزر الدجاج المشوي',
    name_en: 'Grilled Chicken Caesar Salad',
    description_ar: 'خس روماني مقرمش، قطع دجاج مشوي، جبنة بارميزان إيطالية، وخبز كروتون محمص مع صوص السيزر.',
    description_en: 'Crisp romaine lettuce, grilled chicken, parmesan cheese, croutons, and classic Caesar dressing.',
    price: 24,
    original_price: null,
    image_url: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    calories: 340,
    sales_count: 88
  },

  // --- Beverages ---
  {
    id: 'prod_dr1',
    category_id: 'cat_beverages',
    name_ar: 'عصير برتقال طبيعي كبس فريش 100%',
    name_en: 'Freshly Squeezed Orange Juice',
    description_ar: 'عصير برتقال طازج معصور على البارد عند الطلب بدون إضافة سكر أو ماء.',
    description_en: '100% pure cold-pressed fresh orange juice with no added sugar or water.',
    price: 14,
    original_price: null,
    image_url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    calories: 140,
    sales_count: 220
  },
  {
    id: 'prod_dr2',
    category_id: 'cat_beverages',
    name_ar: 'موهيتو فراولة ونعناع منعش',
    name_en: 'Fresh Strawberry Mojito',
    description_ar: 'حبات فراولة طازجة مهروسة مع أوراق النعناع، عصير ليمون، صودا مثلجة ومكعبات ثلج.',
    description_en: 'Muddled fresh strawberries with mint leaves, lime juice, sparkling soda and ice.',
    price: 16,
    original_price: null,
    image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    calories: 160,
    sales_count: 170
  },
  {
    id: 'prod_dr3',
    category_id: 'cat_beverages',
    name_ar: 'موهيتو بلو أوشن المنعش',
    name_en: 'Blue Ocean Mojito',
    description_ar: 'نكهة البلو كوراكاو المميزة مع الليمون الطازج، النعناع الأخضر والصودا الفوارة.',
    description_en: 'Refreshing blue curacao flavor with fresh lime, mint, and sparkling soda.',
    price: 16,
    original_price: null,
    image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    calories: 155,
    sales_count: 135
  },
  {
    id: 'prod_dr4',
    category_id: 'cat_beverages',
    name_ar: 'عصير مانجو استوائي فرغلي',
    name_en: 'Tropical Mango Juice',
    description_ar: 'مانجو استوائي طبيعي غني وبارد بقوام كثيف ومنعش.',
    description_en: 'Rich, chilled natural tropical mango smoothie with a thick texture.',
    price: 15,
    original_price: null,
    image_url: 'https://images.unsplash.com/photo-1546883498-466a9f0f9b69?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    calories: 190,
    sales_count: 104
  },
  {
    id: 'prod_dr5',
    category_id: 'cat_beverages',
    name_ar: 'مشروب غازي بارد (كولا / سبرايت)',
    name_en: 'Chilled Soft Drink',
    description_ar: 'علبة مشروب غازي باردة ومنعشة من اختيارك.',
    description_en: 'Chilled canned soft drink of your choice.',
    price: 4,
    original_price: null,
    image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    calories: 140,
    sales_count: 310
  },

  // --- Desserts ---
  {
    id: 'prod_des1',
    category_id: 'cat_desserts',
    name_ar: 'كريب نوتيلا ولوتس بلجيكي',
    name_en: 'Nutella & Lotus Belgian Crepe',
    description_ar: 'كريب فرنسي طازج محشو ومغطى بكريمة النوتيلا الأصلية وزبدة اللوتس مع بسكويت مطحون.',
    description_en: 'Fresh French crepe smothered in Nutella and Lotus Biscoff spread with crushed biscuits.',
    price: 24,
    original_price: 29,
    image_url: 'https://images.unsplash.com/photo-1519869325930-281384150729?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    is_offer: true,
    calories: 540,
    sales_count: 160
  },
  {
    id: 'prod_des2',
    category_id: 'cat_desserts',
    name_ar: 'وافل الشوكولاتة والفراولة الطازجة',
    name_en: 'Chocolate & Strawberry Waffle',
    description_ar: 'وافل بلجيكي مقرمش من الخارج وطري من الداخل مغطى بصوص الشوكولاتة وقطع الفراولة.',
    description_en: 'Crispy Belgian waffle topped with rich chocolate drizzle and fresh strawberries.',
    price: 25,
    original_price: null,
    image_url: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    calories: 510,
    sales_count: 115
  }
];

export const MITHAQ_STORIES: Story[] = [
  {
    id: 'story_1',
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=700&auto=format&fit=crop&q=80',
    title: 'عرض البرجر الفاخر 🔥',
    offer_name: 'برجر مذاق الكلاسيكي بـ 26 ر.س فقط!',
    offer_price: 26,
    is_active: true,
    story_type: 'product',
    product_id: 'prod_b1',
    button_text: 'اطلب العرض الآن'
  },
  {
    id: 'story_2',
    image_url: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=700&auto=format&fit=crop&q=80',
    title: 'بيتزا نابولي الإيطالية 🍕',
    offer_name: 'خصم 20% على جميع أنواع البيتزا',
    offer_price: 29,
    is_active: true,
    story_type: 'product',
    product_id: 'prod_p1',
    button_text: 'تصفح البيتزا'
  },
  {
    id: 'story_3',
    image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=700&auto=format&fit=crop&q=80',
    title: 'انتعاش الصيف 🍓',
    offer_name: 'موهيتو فراولة وليمون فريش',
    offer_price: 16,
    is_active: true,
    story_type: 'product',
    product_id: 'prod_dr2',
    button_text: 'اطلب الآن'
  }
];

export const MITHAQ_COUPONS: Coupon[] = [
  {
    id: 'coup_1',
    code: 'MITHAQ10',
    discount_type: 'percentage',
    discount_value: 10,
    is_active: true,
    current_uses: 12
  },
  {
    id: 'coup_2',
    code: 'MITHAQ20',
    discount_type: 'percentage',
    discount_value: 20,
    is_active: true,
    current_uses: 5
  },
  {
    id: 'coup_3',
    code: 'WELCOME',
    discount_type: 'fixed',
    discount_value: 15,
    is_active: true,
    current_uses: 28
  }
];

export const MITHAQ_STORE_SETTINGS: StoreSettings = {
  branch_name: 'الفرع الرئيسي',
  status: 'open',
  is_delivery_active: true,
  is_pickup_active: true,
  latitude: 24.7136,
  longitude: 46.6753,
  google_maps_url: 'https://maps.google.com/?q=24.7136,46.6753'
};

export const MITHAQ_APP_SETTINGS = {
  restaurant_name: 'مطعم مذاق | MITHAQ',
  brand_name: 'مذاق | MITHAQ',
  tagline: 'تجربة طعام استثنائية • جودة تستحقها',
  currency: 'ر.س',
  tax_percentage: 15,
  delivery_fee: 10,
  min_order_amount: 25,
  phone: '0500000000',
  whatsapp: '966500000000',
  offers_active: true,
  offers_title: '🔥 عروض مذاق الأسبوعية',
  spin_wheel_enabled: true
};
