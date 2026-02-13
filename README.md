# ⚡ WordPress + React Project Cost Calculator

A real-world example of integrating a **React TypeScript component** into a **WordPress website** using the WordPress REST API.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![WordPress](https://img.shields.io/badge/WordPress-21759B?style=for-the-badge&logo=wordpress&logoColor=white)

## 🎯 What This Project Demonstrates

This project shows how to embed an interactive React component inside WordPress — a common real-world requirement for agencies that need dynamic functionality beyond what page builders offer.

**The Calculator:**
- Multi-step project cost estimator for WordPress agency websites
- Live price calculation as user makes selections
- Volume discount logic (10% off orders over CHF 5,000)
- Submits quote to WordPress via custom REST API endpoint

## 🏗️ WordPress Integration Architecture

```
WordPress Site
├── REST API Endpoints
│   ├── GET  /wp-json/acf/v3/options/calculator_settings  → Load pricing config
│   └── POST /wp-json/custom/v1/quote-submission          → Save quote as custom post
│
├── Custom Post Type: quote_submissions
│   └── Meta fields: client_name, email, total_price, services_json
│
└── React Component (this repo)
    └── Embedded via WordPress shortcode: [react_calculator]
```

## 💡 How React Integrates With WordPress

In a real WordPress installation, this React app is built and enqueued as a WordPress script:

```php
// functions.php
function enqueue_calculator_scripts() {
    wp_enqueue_script(
        'react-calculator',
        get_template_directory_uri() . '/react-build/static/js/main.js',
        [],
        '1.0.0',
        true
    );
    
    // Pass WordPress data to React via wp_localize_script
    wp_localize_script('react-calculator', 'wpCalculatorData', [
        'apiUrl'   => rest_url('custom/v1/'),
        'nonce'    => wp_create_nonce('wp_rest'),
        'currency' => get_option('calculator_currency', 'CHF'),
    ]);
}
add_action('wp_enqueue_scripts', 'enqueue_calculator_scripts');

// Shortcode to embed React app
function calculator_shortcode() {
    return '<div id="react-calculator-root"></div>';
}
add_shortcode('react_calculator', 'calculator_shortcode');
```

```php
// Custom REST API endpoint (routes.php)
add_action('rest_api_init', function() {
    register_rest_route('custom/v1', '/quote-submission', [
        'methods'  => 'POST',
        'callback' => 'save_quote_submission',
        'permission_callback' => '__return_true',
    ]);
});

function save_quote_submission(WP_REST_Request $request) {
    $post_id = wp_insert_post([
        'post_type'   => 'quote_submission',
        'post_status' => 'private',
        'post_title'  => 'Quote from ' . sanitize_text_field($request['name']),
    ]);
    
    update_post_meta($post_id, 'client_email', $request['email']);
    update_post_meta($post_id, 'total_price', $request['total_price']);
    update_post_meta($post_id, 'services', json_encode($request['services']));
    
    // Send email notification
    wp_mail(
        get_option('admin_email'),
        'New Quote Request: ' . $request['name'],
        'Total: CHF ' . $request['total_price']
    );
    
    return new WP_REST_Response(['success' => true, 'post_id' => $post_id], 200);
}
```

## ✨ Features

- **5-step wizard** with progress indicator
- **Real-time price calculation** using useMemo (updates instantly)
- **Multi-select and single-select** categories
- **Volume discount** applied automatically above CHF 5,000
- **Live quote sidebar** showing itemized breakdown
- **Quote submission form** that POSTs to WordPress REST API
- **Project tier detection** (Starter / Professional / Enterprise)
- **WordPress API status indicator** in header

## 🛠️ TypeScript Concepts Used

| Concept | Where Used |
|---------|-----------|
| Interfaces | `ServiceOption`, `QuoteResult`, `QuoteFormData`, `CalculatorSelections` |
| Union Types | `SubmitStatus`, `QuoteResult['tier']` |
| Generic Types | `useState<QuoteFormData>`, `ApiResponse<T>` |
| `useMemo` | Live quote recalculation |
| `useCallback` | Stable toggle/submit functions |
| `useEffect` | WordPress config loading on mount |
| Custom Hook | `useCalculator` — all logic separated from UI |
| `FormEvent<HTMLFormElement>` | Typed form submission |

## 🚀 Run Locally

```bash
git clone https://github.com/suryayousufzai/wp-react-calculator.git
cd wp-react-calculator
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
wp-react-calculator/
├── app/
│   ├── hooks/
│   │   └── useCalculator.ts    # All state logic (selections, submit, steps)
│   ├── types/
│   │   └── calculator.ts       # TypeScript interfaces and types
│   ├── utils/
│   │   └── calculator.ts       # Pricing data + WordPress API simulation
│   └── page.tsx                # Full calculator UI
```

## 👤 Author

**Surya Yousufzai** — WordPress & TypeScript Developer
- GitHub: [@suryayousufzai](https://github.com/suryayousufzai)
- Email: surya.yousufzai@auaf.edu.af
- Location: Fribourg, Switzerland

---
*This project was built to demonstrate React + WordPress integration skills for web development roles.*
