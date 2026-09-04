import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  AutoComplete,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Upload,
  message,
} from 'antd';
import {
  CameraOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  StarOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import PageHeaderSection from '../../common/PageHeaderSection';
import useStore from '../../../store/store';
import {
  archiveIngredient,
  archiveMenuItem,
  archiveVendor,
  applyInvoiceCosts,
  confirmRecipeDraft,
  createIngredient,
  createInvoice,
  createMenuItem,
  createPhotoDraft,
  createVendor,
  discardInvoice,
  discardRecipeDraft,
  fetchFoodCostingDashboard,
  fetchAllMenuItems,
  fetchIngredients,
  fetchInvoices,
  fetchMenuItems,
  fetchRecipeDrafts,
  fetchVendors,
  importSquareMenuItems,
  pollSquareImportStatus,
  scanPrintedMenu,
  updateIngredient,
  updateInvoice,
  updateMenuItem,
  updateVendor,
} from '../../../services/foodCostingApi';
import MenuProfitabilitySimulator from './MenuProfitabilitySimulator';
import IngredientEntryModal from './IngredientEntryModal';
import { isApiTimeoutError } from '../../../utils/axiosInterceptors';
import {
  ACCEPT_IMAGE_OR_PDF,
  MAX_FILE_UPLOAD_MB,
  MAX_IMAGE_UPLOAD_MB,
  isImageOrPdfFile,
  validateFileUploadSize,
  validateImageFileSize,
} from '../../../utils/uploadLimits';

const getPlanName = (plan) =>
  String(plan?.key || plan?.name || plan?.display_name || plan?.package_name || '')
    .trim()
    .toLowerCase();

const isFoodCostingPlan = (planName) =>
  planName.includes('grow') || planName.includes('pro');

const confidenceTag = (score) => {
  const value = Number(score || 0);
  if (value >= 85) return <Tag color="success">Healthy · {value}%</Tag>;
  if (value >= 71) return <Tag color="warning">Moderate · {value}%</Tag>;
  if (value >= 60) return <Tag color="orange">Low · {value}%</Tag>;
  return <Tag color="error">Needs Review · {value}%</Tag>;
};

const UNIT_OPTIONS = [
  { value: 'oz', label: 'oz' },
  { value: 'g', label: 'g' },
  { value: 'mL', label: 'mL' },
  { value: 'kg', label: 'kg' },
  { value: 'each', label: 'each' },
];

const WEIGHT_TO_G = {
  g: 1,
  oz: 28.3495,
  kg: 1000,
};
const VOLUME_TO_ML = { ml: 1, mL: 1, l: 1000 };
const qtyInCostUnit = (qty, fromUnit, toUnit) => {
  const amount = Number(qty);
  if (!(amount >= 0) || Number.isNaN(amount)) return 0;
  const src = String(fromUnit || '').toLowerCase();
  const dst = String(toUnit || '').toLowerCase();
  if (!dst || src === dst) return amount;
  if (WEIGHT_TO_G[src] != null && WEIGHT_TO_G[dst] != null) {
    return (amount * WEIGHT_TO_G[src]) / WEIGHT_TO_G[dst];
  }
  if (VOLUME_TO_ML[src] != null && VOLUME_TO_ML[dst] != null) {
    return (amount * VOLUME_TO_ML[src]) / VOLUME_TO_ML[dst];
  }
  return amount;
};

const handleImageFileSelect = (file, setFile) => {
  const sizeError = validateImageFileSize(file);
  if (sizeError) {
    message.error(sizeError);
    return Upload.LIST_IGNORE;
  }
  setFile(file);
  return false;
};

const handleFileSelect = (file, setFile) => {
  if (!isImageOrPdfFile(file)) {
    message.error('Please upload a PNG, JPG, or PDF file.');
    return Upload.LIST_IGNORE;
  }
  const sizeError = validateFileUploadSize(file);
  if (sizeError) {
    message.error(sizeError);
    return Upload.LIST_IGNORE;
  }
  setFile(file);
  return false;
};

const FoodCostingPage = () => {
  const navigate = useNavigate();
  const fetchCurrentSubscriptionDetails = useStore(
    (s) => s.fetchCurrentSubscriptionDetails
  );

  const [planLoading, setPlanLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [planName, setPlanName] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [dashboardMenuItems, setDashboardMenuItems] = useState([]);
  const [dashboardMenuTotal, setDashboardMenuTotal] = useState(0);
  const [dashboardMenuPage, setDashboardMenuPage] = useState(1);
  const [dashboardMenuOrdering, setDashboardMenuOrdering] = useState('name');
  const dashboardMenuPageSize = 10;
  const [ingredients, setIngredients] = useState([]);
  const [ingredientTotal, setIngredientTotal] = useState(0);
  const [ingredientPage, setIngredientPage] = useState(1);
  const [ingredientPageSize, setIngredientPageSize] = useState(25);
  const [menuItems, setMenuItems] = useState([]);
  const [menuTotal, setMenuTotal] = useState(0);
  const [menuPage, setMenuPage] = useState(1);
  const [menuPageSize, setMenuPageSize] = useState(25);
  const [menuItemsForCategory, setMenuItemsForCategory] = useState([]);
  const [categoryPage, setCategoryPage] = useState(1);
  const [categoryPageSize, setCategoryPageSize] = useState(10);
  const [loadingCategoryMenu, setLoadingCategoryMenu] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const [draftTotal, setDraftTotal] = useState(0);
  const [draftPage, setDraftPage] = useState(1);
  const [invoices, setInvoices] = useState([]);
  const [invoiceTotal, setInvoiceTotal] = useState(0);
  const [invoicePage, setInvoicePage] = useState(1);
  const [vendors, setVendors] = useState([]);
  const [vendorsLoaded, setVendorsLoaded] = useState(false);
  const loadAbortRef = React.useRef(null);
  const loadTabDataRef = React.useRef(null);
  const paginationRef = React.useRef({
    draftPage: 1,
    menuPage: 1,
    menuPageSize: 25,
    menuItemSearch: '',
    invoicePage: 1,
    ingredientPage: 1,
    ingredientPageSize: 25,
    dashboardMenuPage: 1,
  });

  const [ingredientModalOpen, setIngredientModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [ingredientCategory, setIngredientCategory] = useState('');
  const [ingredientOrdering, setIngredientOrdering] = useState('name');
  const [draftSellingPrice, setDraftSellingPrice] = useState('0.00');

  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState(null);
  const [menuItemSearch, setMenuItemSearch] = useState('');
  const [menuSortBy, setMenuSortBy] = useState('item');
  const [importingMenuFromSquare, setImportingMenuFromSquare] = useState(false);
  const [scanningPrintedMenu, setScanningPrintedMenu] = useState(false);
  const [menuScanModalOpen, setMenuScanModalOpen] = useState(false);
  const [menuScanFile, setMenuScanFile] = useState(null);
  const [menuScanResult, setMenuScanResult] = useState(null);
  const [squareImportJobId, setSquareImportJobId] = useState(null);
  const squareImportPollRef = React.useRef(null);
  const [menuForm] = Form.useForm();
  const [recipeIngredientChoices, setRecipeIngredientChoices] = useState([]);

  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoMenuName, setPhotoMenuName] = useState('');
  const [draftResult, setDraftResult] = useState(null);
  const [draftLines, setDraftLines] = useState([]);
  const [confirmingDraft, setConfirmingDraft] = useState(false);
  const [buildingDraft, setBuildingDraft] = useState(false);

  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceReviewOpen, setInvoiceReviewOpen] = useState(false);
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [extractWithAi, setExtractWithAi] = useState(true);
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [applyingInvoice, setApplyingInvoice] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceLines, setInvoiceLines] = useState([]);
  const [invoiceForm] = Form.useForm();
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [vendorForm] = Form.useForm();
  const [savingVendor, setSavingVendor] = useState(false);

  const restaurantId = localStorage.getItem('restaurant_id');
  const locationId = localStorage.getItem('selected_location_id');
  const ingredientFilterRef = React.useRef({
    search: '',
    category: '',
    ordering: 'name',
  });
  ingredientFilterRef.current = {
    search: ingredientSearch,
    category: ingredientCategory,
    ordering: ingredientOrdering,
  };

  paginationRef.current = {
    draftPage,
    menuPage,
    menuPageSize,
    menuItemSearch,
    menuSortBy,
    invoicePage,
    ingredientPage,
    ingredientPageSize,
    dashboardMenuPage,
    dashboardMenuOrdering,
  };

  useEffect(() => {
    let mounted = true;
    setPlanLoading(true);

    const run = async () => {
      try {
        // One-shot plan check. Do not depend on subscriptionDetails/currentPackage
        // or this will re-fetch forever (store updates retrigger the effect).
        const result = await fetchCurrentSubscriptionDetails?.(false);
        const storeState = useStore.getState();
        const name = getPlanName(
          result?.data?.package ||
            storeState.subscriptionDetails?.package ||
            storeState.currentPackage
        );
        if (!mounted) return;
        setPlanName(name);
        setAllowed(isFoodCostingPlan(name));
      } catch {
        const storeState = useStore.getState();
        const name = getPlanName(
          storeState.subscriptionDetails?.package || storeState.currentPackage
        );
        if (!mounted) return;
        setPlanName(name);
        setAllowed(isFoodCostingPlan(name));
      } finally {
        if (mounted) setPlanLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTabData = useCallback(
    async (tab, opts = {}) => {
      if (!allowed || !restaurantId) return;
      if (loadAbortRef.current) {
        loadAbortRef.current.abort();
      }
      const controller = new AbortController();
      loadAbortRef.current = controller;

      const pg = paginationRef.current;

      setLoading(true);
      try {
        switch (tab) {
          case 'dashboard': {
            const page = opts.page ?? pg.dashboardMenuPage;
            const pageSize = opts.pageSize ?? dashboardMenuPageSize;
            const ordering = opts.ordering ?? pg.dashboardMenuOrdering ?? 'name';
            const [dash, menuData] = await Promise.all([
              fetchFoodCostingDashboard(),
              fetchMenuItems({ page, pageSize, ordering }),
            ]);
            if (controller.signal.aborted) return;
            setDashboard(dash);
            setDashboardMenuItems(menuData.results);
            setDashboardMenuTotal(menuData.count);
            setDashboardMenuPage(page);
            setDashboardMenuOrdering(ordering);
            break;
          }
          case 'drafts': {
            const page = opts.page ?? pg.draftPage;
            const draftData = await fetchRecipeDrafts('pending', { page, pageSize: 20 });
            if (controller.signal.aborted) return;
            setDrafts(draftData.results);
            setDraftTotal(draftData.count);
            setDraftPage(page);
            break;
          }
          case 'menu': {
            if (pg.menuSortBy === 'category') {
              break;
            }
            const page = opts.page ?? pg.menuPage;
            const pageSize = opts.pageSize ?? pg.menuPageSize;
            const search = opts.search ?? pg.menuItemSearch;
            const menuData = await fetchMenuItems({ page, pageSize, search });
            if (controller.signal.aborted) return;
            setMenuItems(menuData.results);
            setMenuTotal(menuData.count);
            setMenuPage(page);
            setMenuPageSize(pageSize);
            break;
          }
          case 'vendors': {
            const [vendorList, ingData, invData] = await Promise.all([
              fetchVendors(),
              fetchIngredients({ page: 1, pageSize: 500, ordering: 'name' }),
              fetchInvoices('', { page: 1, pageSize: 500 }),
            ]);
            if (controller.signal.aborted) return;
            setVendors(Array.isArray(vendorList) ? vendorList : []);
            setVendorsLoaded(true);
            setIngredients(ingData.results);
            setInvoices(invData.results);
            break;
          }
          case 'invoices': {
            const page = opts.page ?? pg.invoicePage;
            const invData = await fetchInvoices('', { page, pageSize: 20 });
            if (controller.signal.aborted) return;
            setInvoices(invData.results);
            setInvoiceTotal(invData.count);
            setInvoicePage(page);
            if (!vendorsLoaded) {
              const vendorList = await fetchVendors();
              if (controller.signal.aborted) return;
              setVendors(Array.isArray(vendorList) ? vendorList : []);
              setVendorsLoaded(true);
            }
            break;
          }
          case 'ingredients': {
            const page = opts.page ?? pg.ingredientPage;
            const pageSize = opts.pageSize ?? pg.ingredientPageSize;
            const ingData = await fetchIngredients({
              search: ingredientFilterRef.current.search,
              category: ingredientFilterRef.current.category,
              ordering: ingredientFilterRef.current.ordering,
              page,
              pageSize,
            });
            if (controller.signal.aborted) return;
            setIngredients(ingData.results);
            setIngredientTotal(ingData.count);
            setIngredientPage(page);
            setIngredientPageSize(pageSize);
            if (!vendorsLoaded) {
              const vendorList = await fetchVendors();
              if (controller.signal.aborted) return;
              setVendors(Array.isArray(vendorList) ? vendorList : []);
              setVendorsLoaded(true);
            }
            break;
          }
          default:
            break;
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        const data = error?.response?.data;
        if (data?.upgrade_required) {
          setAllowed(false);
        } else {
          message.error(data?.error || 'Failed to load Food Costing data');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [allowed, restaurantId, vendorsLoaded, dashboardMenuPageSize]
  );

  loadTabDataRef.current = loadTabData;

  const refresh = useCallback(
    async (scopes = ['dashboard']) => {
      if (!allowed || !restaurantId) return;
      const unique = [...new Set(scopes)];
      setLoading(true);
      try {
        const tasks = [];
        if (unique.includes('dashboard')) {
          tasks.push(fetchFoodCostingDashboard().then(setDashboard));
        }
        if (unique.includes('menu')) {
          const pg = paginationRef.current;
          tasks.push(
            fetchMenuItems({
              page: pg.dashboardMenuPage,
              pageSize: dashboardMenuPageSize,
            }).then((data) => {
              setDashboardMenuItems(data.results);
              setDashboardMenuTotal(data.count);
            })
          );
          if (pg.menuSortBy === 'category') {
            tasks.push(
              fetchAllMenuItems({ search: pg.menuItemSearch }).then((data) => {
                setMenuItemsForCategory(data.results);
                setMenuTotal(data.count);
              })
            );
          } else {
            tasks.push(
              fetchMenuItems({
                page: pg.menuPage,
                pageSize: pg.menuPageSize,
                search: pg.menuItemSearch,
              }).then((data) => {
                setMenuItems(data.results);
                setMenuTotal(data.count);
              })
            );
          }
        }
        if (unique.includes('ingredients')) {
          const pg = paginationRef.current;
          tasks.push(
            fetchIngredients({
              search: ingredientFilterRef.current.search,
              category: ingredientFilterRef.current.category,
              ordering: ingredientFilterRef.current.ordering,
              page: pg.ingredientPage,
              pageSize: pg.ingredientPageSize,
            }).then((data) => {
              setIngredients(data.results);
              setIngredientTotal(data.count);
            })
          );
        }
        if (unique.includes('drafts')) {
          tasks.push(
            fetchRecipeDrafts('pending', {
              page: paginationRef.current.draftPage,
              pageSize: 20,
            }).then((data) => {
              setDrafts(data.results);
              setDraftTotal(data.count);
            })
          );
        }
        if (unique.includes('invoices')) {
          tasks.push(
            fetchInvoices('', {
              page: paginationRef.current.invoicePage,
              pageSize: 20,
            }).then((data) => {
              setInvoices(data.results);
              setInvoiceTotal(data.count);
            })
          );
        }
        if (unique.includes('vendors')) {
          tasks.push(
            fetchVendors().then((list) => {
              setVendors(Array.isArray(list) ? list : []);
              setVendorsLoaded(true);
            })
          );
        }
        await Promise.all(tasks);
      } catch (error) {
        const data = error?.response?.data;
        if (data?.upgrade_required) {
          setAllowed(false);
        } else {
          message.error(data?.error || 'Failed to refresh Food Costing data');
        }
      } finally {
        setLoading(false);
      }
    },
    [
      allowed,
      restaurantId,
      activeTab,
      dashboardMenuPageSize,
    ]
  );

  const ensureModalData = useCallback(async () => {
    const tasks = [];
    if (!vendorsLoaded) {
      tasks.push(
        fetchVendors().then((list) => {
          setVendors(Array.isArray(list) ? list : []);
          setVendorsLoaded(true);
        })
      );
    }
    if (!ingredients.length) {
      tasks.push(
        fetchIngredients({ page: 1, pageSize: 500, ordering: 'name' }).then((data) => {
          setIngredients(data.results);
          setIngredientTotal(data.count);
        })
      );
    }
    if (tasks.length) await Promise.all(tasks);
  }, [vendorsLoaded, ingredients.length]);

  const ingredientFilterInitializedRef = React.useRef(false);
  const menuSearchInitializedRef = React.useRef(false);

  useEffect(() => {
    if (!allowed || !restaurantId || activeTab !== 'ingredients') {
      ingredientFilterInitializedRef.current = false;
      return undefined;
    }
    if (!ingredientFilterInitializedRef.current) {
      ingredientFilterInitializedRef.current = true;
      return undefined;
    }
    const timer = window.setTimeout(() => {
      loadTabDataRef.current?.('ingredients', { page: 1 });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [
    allowed,
    restaurantId,
    activeTab,
    ingredientSearch,
    ingredientCategory,
    ingredientOrdering,
  ]);

  useEffect(() => {
    if (!allowed || !restaurantId || activeTab !== 'menu') {
      menuSearchInitializedRef.current = false;
      return undefined;
    }
    if (menuSortBy === 'category') {
      menuSearchInitializedRef.current = false;
      return undefined;
    }
    if (!menuSearchInitializedRef.current) {
      menuSearchInitializedRef.current = true;
      return undefined;
    }
    const timer = window.setTimeout(() => {
      loadTabDataRef.current?.('menu', { page: 1, search: menuItemSearch });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [allowed, restaurantId, activeTab, menuSortBy, menuItemSearch]);

  useEffect(() => {
    if (!allowed || !restaurantId || activeTab !== 'menu' || menuSortBy !== 'category') {
      return undefined;
    }
    let cancelled = false;
    setLoadingCategoryMenu(true);
    fetchAllMenuItems({ search: menuItemSearch })
      .then((data) => {
        if (!cancelled) {
          setMenuItemsForCategory(data.results);
          setCategoryPage(1);
        }
      })
      .catch(() => {
        if (!cancelled) setMenuItemsForCategory([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingCategoryMenu(false);
      });
    return () => {
      cancelled = true;
    };
  }, [allowed, restaurantId, activeTab, menuSortBy, menuItemSearch]);

  const handleMenuPageChange = useCallback(
    (page, pageSize) => {
      setMenuPage(page);
      if (pageSize) setMenuPageSize(pageSize);
      loadTabData('menu', { page, pageSize, search: menuItemSearch });
    },
    [loadTabData, menuItemSearch]
  );

  const handleDashboardMenuPageChange = useCallback(
    (page) => {
      setDashboardMenuPage(page);
      loadTabData('dashboard', { page, ordering: dashboardMenuOrdering });
    },
    [loadTabData, dashboardMenuOrdering]
  );

  const handleDashboardMenuTableChange = useCallback(
    (pagination, _filters, sorter) => {
      const page = pagination?.current || 1;
      const columnKey = sorter?.columnKey || sorter?.field;
      let ordering = dashboardMenuOrdering;

      if (columnKey && sorter?.order) {
        const fieldMap = {
          name: 'name',
          selling_price: 'selling_price',
          food_cost_percent: 'food_cost_percent',
          confidence_score: 'confidence_score',
          source: 'source',
        };
        const field = fieldMap[columnKey] || columnKey;
        ordering = sorter.order === 'descend' ? `-${field}` : field;
      }

      setDashboardMenuPage(page);
      setDashboardMenuOrdering(ordering);
      loadTabData('dashboard', { page, ordering });
    },
    [loadTabData, dashboardMenuOrdering]
  );

  const handleIngredientPageChange = useCallback(
    (page, pageSize) => {
      setIngredientPage(page);
      if (pageSize) setIngredientPageSize(pageSize);
      loadTabData('ingredients', { page, pageSize });
    },
    [loadTabData]
  );

  const handleTabChange = useCallback(
    (tab) => {
      setActiveTab(tab);
      loadTabData(tab);
    },
    [loadTabData]
  );

  const handleSlowAiUpload = useCallback(
    (tab) => {
      message.warning(
        'LIO is still processing your upload. Refreshing automatically — check the list in a moment.',
        7
      );
      handleTabChange(tab);
      [5000, 15000, 30000, 60000].forEach((delay) => {
        window.setTimeout(() => {
          refresh(['dashboard', tab === 'invoices' ? 'invoices' : 'drafts']);
          loadTabData(tab);
        }, delay);
      });
    },
    [handleTabChange, refresh, loadTabData]
  );

  useEffect(() => {
    if (allowed) loadTabData('dashboard');
    return () => {
      if (loadAbortRef.current) loadAbortRef.current.abort();
    };
  }, [allowed, loadTabData]);

  const kpiCards = useMemo(
    () => [
      {
        title: 'Total Menu Items',
        value: dashboard?.total_menu_items ?? 0,
      },
      {
        title: 'High Confidence',
        value: dashboard?.high_confidence_items ?? 0,
      },
      {
        title: 'Needs Review',
        value: dashboard?.items_needing_review ?? 0,
      },
      {
        title: 'Pending Drafts',
        value: dashboard?.pending_drafts ?? drafts.length,
      },
      {
        title: 'Invoices to Review',
        value:
          dashboard?.invoices_pending_review ??
          invoices.filter((i) =>
            ['pending_review', 'partially_matched'].includes(i.status)
          ).length,
      },
      {
        title: 'AI Builds Used',
        value: `${dashboard?.ai_builds_used ?? 0} / ${dashboard?.ai_builds_limit ?? 0}`,
      },
    ],
    [dashboard, drafts.length, invoices]
  );

  const recipeIngredientSelectOptions = useMemo(() => {
    const source =
      recipeIngredientChoices.length > 0 ? recipeIngredientChoices : ingredients;
    const options = source.map((ing) => ({
      value: ing.name,
      label: ing.name,
    }));
    const seen = new Set(options.map((opt) => String(opt.value).toLowerCase()));
    const lines = menuForm.getFieldValue('recipe_lines') || [];
    lines.forEach((line) => {
      const name = String(line?.name || '').trim();
      if (name && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        options.push({
          value: name,
          label: name,
        });
      }
    });
    return options;
  }, [recipeIngredientChoices, ingredients, menuModalOpen, menuForm]);

  const filteredMenuItems = useMemo(() => {
    if (activeTab === 'menu') return menuItems;
    const query = menuItemSearch.trim().toLowerCase();
    if (!query) return menuItems;
    return menuItems.filter((item) => {
      const name = String(item.name || '').toLowerCase();
      const category = String(item.category || '').toLowerCase();
      return name.includes(query) || category.includes(query);
    });
  }, [menuItems, menuItemSearch, activeTab]);

  const menuItemSearchOptions = useMemo(() => {
    if (!menuItemSearch.trim()) return [];
    return filteredMenuItems.slice(0, 8).map((item) => ({
      value: item.name,
      label: item.category ? `${item.name} · ${item.category}` : item.name,
    }));
  }, [filteredMenuItems, menuItemSearch]);

  const menuItemsByCategory = useMemo(() => {
    const source =
      menuSortBy === 'category' ? menuItemsForCategory : filteredMenuItems;
    const groups = new Map();
    source.forEach((item) => {
      const category = String(item.category || '').trim() || 'Uncategorized';
      if (!groups.has(category)) groups.set(category, []);
      groups.get(category).push(item);
    });
    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([category, items]) => ({
        key: category,
        category,
        count: items.length,
        items: items
          .slice()
          .sort((a, b) =>
            String(a.name || '').localeCompare(String(b.name || ''))
          ),
      }));
  }, [menuSortBy, menuItemsForCategory, filteredMenuItems]);

  const paginatedCategoryGroups = useMemo(() => {
    const start = (categoryPage - 1) * categoryPageSize;
    return menuItemsByCategory.slice(start, start + categoryPageSize);
  }, [menuItemsByCategory, categoryPage, categoryPageSize]);

  const handleMenuSortByChange = useCallback(
    (value) => {
      setMenuSortBy(value);
      setCategoryPage(1);
      if (value === 'item') {
        loadTabData('menu', {
          page: 1,
          pageSize: menuPageSize,
          search: menuItemSearch,
        });
      }
    },
    [loadTabData, menuPageSize, menuItemSearch]
  );

  const openDraftReview = (draft) => {
    setDraftResult({
      draft,
      ai_builds_used: dashboard?.ai_builds_used,
      ai_builds_limit: dashboard?.ai_builds_limit,
    });
    const lines = (draft?.lines || []).map((line) => ({
      draft_line_id: line.id,
      name: line.name,
      quantity: Number(line.suggested_portion),
      unit: line.unit,
      is_confirmed: true,
      exclude: false,
      line_type: line.line_type,
      confidence: line.confidence,
      matched_ingredient_id: line.matched_ingredient_id,
      matched_ingredient_name: line.matched_ingredient_name,
      cost_per_standardized_unit: line.cost_per_standardized_unit,
      line_cost_estimate: line.line_cost_estimate,
      needs_pricing: line.needs_pricing,
    }));
    setDraftLines(lines);
    setDraftSellingPrice(
      draft?.menu_item
        ? String(
            menuItems.find((m) => m.id === draft.menu_item)?.selling_price ?? '0.00'
          )
        : '0.00'
    );
    setPhotoFile(null);
    setPhotoModalOpen(true);
  };

  const handleDiscardDraft = async (draftId) => {
    try {
      await discardRecipeDraft(draftId);
      message.success('Draft discarded');
      if (draftResult?.draft?.id === draftId) {
        setPhotoModalOpen(false);
        setDraftResult(null);
        setDraftLines([]);
      }
      refresh(['dashboard', 'drafts']);
    } catch (error) {
      message.error(error?.response?.data?.error || 'Failed to discard draft');
    }
  };

  const openInvoiceReview = async (invoice) => {
    await ensureModalData();
    setSelectedInvoice(invoice);
    setInvoiceLines(
      (invoice.lines || []).map((line) => ({
        ...line,
        ingredient_id: line.ingredient || null,
      }))
    );
    setInvoiceReviewOpen(true);
  };

  const handleCreateInvoice = async () => {
    try {
      const values = await invoiceForm.validateFields();
      if (!invoiceFile && !(values.lines || []).length) {
        message.error('Upload an invoice photo or add at least one line');
        return;
      }
      if (invoiceFile) {
        const sizeError = validateFileUploadSize(invoiceFile);
        if (sizeError) {
          message.error(sizeError);
          return;
        }
      }
      setSavingInvoice(true);
      const lines = (values.lines || [])
        .filter((line) => (line?.raw_name || '').trim())
        .map((line) => ({
          raw_name: line.raw_name,
          vendor_item_number: line.vendor_item_number || '',
          pack_size_label: line.pack_size_label || '',
          actual_weight: line.actual_weight ?? null,
          actual_weight_unit: line.actual_weight_unit || 'lb',
          total_cost: line.total_cost || 0,
          is_non_food: !!line.is_non_food,
        }));
      const result = await createInvoice({
        file: invoiceFile,
        extractWithAi: !!invoiceFile && extractWithAi,
        vendorName: values.vendor_name || '',
        vendorId: values.vendor_id || null,
        invoiceNumber: values.invoice_number || '',
        invoiceDate: values.invoice_date || '',
        lines,
      });
      message.success('Invoice saved for review');
      setInvoiceModalOpen(false);
      setInvoiceFile(null);
      invoiceForm.resetFields();
      handleTabChange('invoices');
      if (result?.invoice) openInvoiceReview(result.invoice);
      refresh(['dashboard']);
    } catch (error) {
      if (error?.errorFields) return;
      if (isApiTimeoutError(error)) {
        setInvoiceModalOpen(false);
        setInvoiceFile(null);
        invoiceForm.resetFields();
        handleSlowAiUpload('invoices');
        return;
      }
      message.error(error?.response?.data?.error || 'Failed to save invoice');
    } finally {
      setSavingInvoice(false);
    }
  };

  const handleSaveInvoiceLines = async () => {
    if (!selectedInvoice?.id) return;
    try {
      setSavingInvoice(true);
      const updated = await updateInvoice(selectedInvoice.id, {
        lines: invoiceLines.map((line) => ({
          id: line.id,
          ingredient_id: line.ingredient_id || null,
          raw_name: line.raw_name,
          vendor_item_number: line.vendor_item_number || '',
          pack_size_label: line.pack_size_label || '',
          actual_weight: line.actual_weight,
          actual_weight_unit: line.actual_weight_unit || 'lb',
          total_cost: line.total_cost || 0,
          is_non_food: !!line.is_non_food,
          needs_review: line.needs_review !== false,
        })),
      });
      setSelectedInvoice(updated);
      setInvoiceLines(
        (updated.lines || []).map((line) => ({
          ...line,
          ingredient_id: line.ingredient || null,
        }))
      );
      message.success('Invoice lines updated');
      refresh(['dashboard', 'invoices']);
    } catch (error) {
      message.error(error?.response?.data?.error || 'Failed to update invoice');
    } finally {
      setSavingInvoice(false);
    }
  };

  const handleApplyInvoice = async (createMissing = false) => {
    if (!selectedInvoice?.id) return;
    try {
      setApplyingInvoice(true);
      const updated = await updateInvoice(selectedInvoice.id, {
        lines: invoiceLines.map((line) => ({
          id: line.id,
          ingredient_id: line.ingredient_id || null,
          raw_name: line.raw_name,
          vendor_item_number: line.vendor_item_number || '',
          pack_size_label: line.pack_size_label || '',
          actual_weight: line.actual_weight,
          actual_weight_unit: line.actual_weight_unit || 'lb',
          total_cost: line.total_cost || 0,
          is_non_food: !!line.is_non_food,
          needs_review: line.needs_review !== false,
        })),
      });
      const result = await applyInvoiceCosts(selectedInvoice.id, {
        createMissingIngredients: createMissing,
      });
      message.success(
        `Applied costs to ${result?.updated_ingredient_ids?.length || 0} ingredient(s)`
      );
      setSelectedInvoice(result.invoice || updated);
      setInvoiceLines(
        ((result.invoice || updated)?.lines || []).map((line) => ({
          ...line,
          ingredient_id: line.ingredient || null,
        }))
      );
      refresh(['dashboard', 'invoices', 'ingredients', 'menu']);
    } catch (error) {
      message.error(error?.response?.data?.error || 'Failed to apply invoice costs');
    } finally {
      setApplyingInvoice(false);
    }
  };

  const openCreateVendor = () => {
    setEditingVendor(null);
    vendorForm.resetFields();
    setVendorModalOpen(true);
  };

  const openEditVendor = (record) => {
    setEditingVendor(record);
    vendorForm.setFieldsValue({ name: record.name });
    setVendorModalOpen(true);
  };

  const saveVendor = async () => {
    try {
      const values = await vendorForm.validateFields();
      setSavingVendor(true);
      if (editingVendor) {
        await updateVendor(editingVendor.id, values);
        message.success('Vendor updated');
      } else {
        await createVendor(values);
        message.success('Vendor created');
      }
      setVendorModalOpen(false);
      refresh(['vendors']);
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error?.response?.data?.error || 'Failed to save vendor');
    } finally {
      setSavingVendor(false);
    }
  };

  const openCreateIngredient = () => {
    setEditingIngredient(null);
    setIngredientModalOpen(true);
  };

  const openEditIngredient = (record) => {
    setEditingIngredient(record);
    setIngredientModalOpen(true);
  };

  const persistIngredient = async (payload, editing) => {
    if (editing) {
      await updateIngredient(editing.id, payload);
      message.success('Ingredient updated');
    } else {
      await createIngredient(payload);
      message.success('Ingredient created');
    }
  };

  const loadRecipeIngredientChoices = async () => {
    try {
      const ings = await fetchIngredients({ ordering: 'name', page: 1, pageSize: 500 });
      setRecipeIngredientChoices(ings.results);
    } catch {
      setRecipeIngredientChoices(Array.isArray(ingredients) ? ingredients : []);
    }
  };

  const emptyRecipeLine = () => ({
    ingredient_id: undefined,
    name: '',
    quantity: 1,
    unit: 'oz',
    is_confirmed: true,
  });

  const openCreateMenuItem = () => {
    setEditingMenuItem(null);
    menuForm.resetFields();
    menuForm.setFieldsValue({
      selling_price: '0.00',
      recipe_lines: [emptyRecipeLine()],
    });
    setMenuModalOpen(true);
    loadRecipeIngredientChoices();
  };

  const openEditMenuItem = (record) => {
    setEditingMenuItem(record);
    const lines =
      record?.current_recipe?.lines?.map((line) => ({
        ingredient_id: line.ingredient,
        name: line.ingredient_name,
        quantity: Number(line.quantity),
        unit: line.unit,
        is_confirmed: line.is_confirmed,
        notes: line.notes,
      })) || [];
    menuForm.setFieldsValue({
      name: record.name,
      category: record.category,
      selling_price: record.selling_price != null ? String(record.selling_price) : '0.00',
      notes: record.notes,
      recipe_lines: lines.length ? lines : [emptyRecipeLine()],
    });
    setMenuModalOpen(true);
    loadRecipeIngredientChoices();
  };

  const goToMenuItem = (record) => {
    if (!record) return;
    if (activeTab !== 'menu') {
      setActiveTab('menu');
      loadTabData('menu');
    }
    openEditMenuItem(record);
  };

  const saveMenuItem = async () => {
    try {
      const values = await menuForm.validateFields();
      const payload = {
        ...values,
        recipe_lines: (values.recipe_lines || []).filter(
          (line) => line?.name || line?.ingredient_id
        ),
      };
      if (editingMenuItem) {
        await updateMenuItem(editingMenuItem.id, payload);
        message.success('Menu item updated');
      } else {
        await createMenuItem(payload);
        message.success('Menu item created');
      }
      setMenuModalOpen(false);
      refresh(['dashboard', 'menu']);
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error?.response?.data?.error || 'Failed to save menu item');
    }
  };

  const _stopSquareImportPoll = () => {
    if (squareImportPollRef.current) {
      clearInterval(squareImportPollRef.current);
      squareImportPollRef.current = null;
    }
  };

  const handleImportMenuFromSquare = async () => {
    if (importingMenuFromSquare) return;
    try {
      setImportingMenuFromSquare(true);
      const result = await importSquareMenuItems();
      if (!result?.success) {
        message.error(result?.error || 'Failed to start Square import');
        setImportingMenuFromSquare(false);
        return;
      }
      const jobId = result.job_id;
      setSquareImportJobId(jobId);
      message.loading({ content: 'Fetching menu from POS…', key: 'sq-import', duration: 0 });

      squareImportPollRef.current = setInterval(async () => {
        try {
          const poll = await pollSquareImportStatus(jobId);
          if (poll.status === 'done') {
            _stopSquareImportPoll();
            setImportingMenuFromSquare(false);
            setSquareImportJobId(null);
            const created = Number(poll.created_count || 0);
            const updated = Number(poll.updated_count || 0);
            message.success({
              content: `Square import complete: ${created} created, ${updated} updated.`,
              key: 'sq-import',
              duration: 4,
            });
            await refresh(['dashboard', 'menu']);
          } else if (poll.status === 'error') {
            _stopSquareImportPoll();
            setImportingMenuFromSquare(false);
            setSquareImportJobId(null);
            message.error({ content: poll.error || 'Square import failed', key: 'sq-import', duration: 5 });
          }
        } catch {
          // keep polling on transient network errors
        }
      }, 3000);
    } catch (error) {
      setImportingMenuFromSquare(false);
      setSquareImportJobId(null);
      message.error(error?.response?.data?.error || 'Failed to fetch menu from POS');
    }
  };

  const handleBuildFromPhoto = async () => {
    if (!photoFile) {
      message.error('Please choose a photo first');
      return;
    }
    const sizeError = validateImageFileSize(photoFile);
    if (sizeError) {
      message.error(sizeError);
      return;
    }
    setBuildingDraft(true);
    try {
      const result = await createPhotoDraft({
        image: photoFile,
        menuItemName: photoMenuName,
      });
      setDraftResult(result);
      const lines = (result?.draft?.lines || []).map((line) => ({
        draft_line_id: line.id,
        name: line.name,
        quantity: Number(line.suggested_portion),
        unit: line.unit,
        is_confirmed: true,
        exclude: false,
        line_type: line.line_type,
        confidence: line.confidence,
        matched_ingredient_id: line.matched_ingredient_id,
        matched_ingredient_name: line.matched_ingredient_name,
        cost_per_standardized_unit: line.cost_per_standardized_unit,
        line_cost_estimate: line.line_cost_estimate,
        needs_pricing: line.needs_pricing,
      }));
      setDraftLines(lines);
      setDraftSellingPrice('0.00');
      message.success('LIO created a draft. Review before confirming.');
      handleTabChange('drafts');
      refresh(['dashboard']);
    } catch (error) {
      const data = error?.response?.data;
      if (isApiTimeoutError(error)) {
        setPhotoModalOpen(false);
        setPhotoFile(null);
        setPhotoMenuName('');
        handleSlowAiUpload('drafts');
        return;
      }
      message.error(data?.error || 'Failed to build recipe from photo');
      if (data?.upgrade_required || data?.limit_reached) {
        // keep modal open so user can see message
      }
    } finally {
      setBuildingDraft(false);
    }
  };

  const handleConfirmDraft = async () => {
    if (!draftResult?.draft?.id) return;
    setConfirmingDraft(true);
    try {
      const result = await confirmRecipeDraft(draftResult.draft.id, {
        selling_price: draftSellingPrice,
        lines: draftLines.map((line) => ({
          draft_line_id: line.draft_line_id,
          name: line.name,
          quantity: line.quantity,
          unit: line.unit,
          is_confirmed: line.is_confirmed,
          exclude: line.exclude,
        })),
      });
      message.success('Draft confirmed. Continue editing the recipe below.');
      const menuItem = result?.menu_item;
      setPhotoModalOpen(false);
      setPhotoFile(null);
      setDraftResult(null);
      setDraftLines([]);
      setPhotoMenuName('');
      setDraftSellingPrice('0.00');
      await refresh(['dashboard', 'menu', 'drafts']);
      if (menuItem) {
        openEditMenuItem(menuItem);
      }
      handleTabChange('menu');
    } catch (error) {
      message.error(error?.response?.data?.error || 'Failed to confirm draft');
    } finally {
      setConfirmingDraft(false);
    }
  };

  const handleScanPrintedMenu = async () => {
    if (!menuScanFile) {
      message.error('Please choose a menu image or PDF first');
      return;
    }
    const sizeError = validateFileUploadSize(menuScanFile);
    if (sizeError) {
      message.error(sizeError);
      return;
    }
    setScanningPrintedMenu(true);
    try {
      const result = await scanPrintedMenu({ file: menuScanFile });
      setMenuScanResult(result);
      message.success(
        result?.message || `Imported ${result?.created_count || 0} menu item(s).`
      );
      await refresh(['dashboard', 'menu']);
    } catch (error) {
      const data = error?.response?.data;
      if (isApiTimeoutError(error)) {
        message.warning(
          'Menu scan is taking longer than usual. Refresh Menu Items shortly.'
        );
        setMenuScanModalOpen(false);
        setMenuScanFile(null);
        handleTabChange('menu');
        return;
      }
      message.error(data?.error || 'Failed to scan printed menu');
    } finally {
      setScanningPrintedMenu(false);
    }
  };

  if (planLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spin size="large" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="p-2 md:p-4">
        <PageHeaderSection
          title="Menu Intelligence"
          description={
            <>
              Growlio tells you how your restaurant is performing.
              <br />
              Menu Intelligence tells you how your menu is performing.
            </>
          }
        />
        <Card className="max-w-3xl mx-auto text-center py-8">
          <StarOutlined className="text-4xl text-[#FF8132] mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Grow or Pro plan required</h2>
          <p className="text-gray-600 mb-6">
            Menu Intelligence (manual recipes, LIO photo builds, and confidence scores) is
            available on Grow and Pro. Your current plan
            {planName ? `: ${planName}` : ''} does not include this module.
          </p>
          <Button
            type="primary"
            size="large"
            className="!bg-[#FF8132] hover:!bg-[#EB5B00] border-none"
            onClick={() => navigate('/dashboard/pricing')}
          >
            Upgrade plan
          </Button>
        </Card>
      </div>
    );
  }

  if (!restaurantId || !locationId) {
    return (
      <div className="p-4">
        <Alert
          type="warning"
          showIcon
          message="Select a restaurant and location first"
          description="Food Costing is location-scoped. Choose a location from the header, then reopen this page."
        />
      </div>
    );
  }

  const ingredientColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => String(a.name || '').localeCompare(String(b.name || '')),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (v) => v || '—',
      sorter: (a, b) =>
        String(a.category || '').localeCompare(String(b.category || '')),
    },
    {
      title: 'Vendor',
      dataIndex: 'vendor',
      key: 'vendor',
      render: (vendorId) =>
        vendors.find((v) => v.id === vendorId)?.name || '—',
    },
    {
      title: 'Purchase',
      key: 'purchase',
      render: (_, r) => {
        const inner =
          r.purchase_inner_pack_qty && r.purchase_inner_pack_type
            ? `${r.purchase_inner_pack_qty} ${r.purchase_inner_pack_type}`
            : '';
        const contents = r.purchase_contents_qty
          ? `${r.purchase_contents_qty} ${r.purchase_contents_unit || ''}`.trim()
          : '';
        const pack = r.purchase_unit_label || 'case';
        if (inner && contents) return `${r.purchase_pack_qty || 1} ${pack} · ${inner} · ${contents}`;
        if (contents) return `${r.purchase_pack_qty || 1} ${pack} · ${contents}`;
        return r.purchase_unit_label || '—';
      },
    },
    { title: 'Unit', dataIndex: 'standardized_unit', key: 'unit', width: 90 },
    {
      title: 'Yield',
      key: 'yield',
      width: 110,
      render: (_, r) => {
        const source = r.yield_source;
        if (source === 'lio_estimate') return <Tag color="orange">LIO est.</Tag>;
        if (r.yield_percent != null && r.yield_percent !== '') {
          return `${Number(r.yield_percent).toFixed(1)}%`;
        }
        return '—';
      },
    },
    {
      title: 'Cost / unit',
      dataIndex: 'cost_per_standardized_unit',
      key: 'cost',
      render: (v) => `$${Number(v || 0).toFixed(4)}`,
      sorter: (a, b) =>
        Number(a.cost_per_standardized_unit || 0) -
        Number(b.cost_per_standardized_unit || 0),
    },
    {
      title: 'Catch weight',
      dataIndex: 'is_catch_weight',
      key: 'cw',
      render: (v) => (v ? <Tag color="blue">Yes</Tag> : <Tag>No</Tag>),
    },
    {
      title: 'Cost status',
      dataIndex: 'is_estimated_cost',
      key: 'est',
      render: (v) =>
        v ? <Tag color="orange">Estimated</Tag> : <Tag color="green">Confirmed</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openEditIngredient(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Archive this ingredient?"
            onConfirm={async () => {
              await archiveIngredient(record.id);
              message.success('Ingredient archived');
              refresh(['dashboard', 'ingredients', 'menu']);
            }}
          >
            <Button size="small" danger>
              Archive
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const menuColumns = [
    {
      title: 'Item',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <button
          type="button"
          className="text-left font-medium text-[#FF8132] hover:underline bg-transparent border-0 p-0 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            goToMenuItem(record);
          }}
        >
          {name}
        </button>
      ),
    },
    {
      title: 'Sell price',
      dataIndex: 'selling_price',
      key: 'price',
      render: (v) => `$${Number(v || 0).toFixed(2)}`,
    },
    {
      title: 'Plate cost',
      key: 'plate',
      render: (_, r) =>
        r.current_recipe
          ? `$${Number(r.current_recipe.plate_cost || 0).toFixed(2)}`
          : '—',
    },
    {
      title: 'Food cost %',
      key: 'fc',
      render: (_, r) =>
        r.current_recipe?.food_cost_percent != null
          ? `${Number(r.current_recipe.food_cost_percent).toFixed(1)}%`
          : '—',
    },
    {
      title: 'Confidence',
      dataIndex: 'confidence_score',
      key: 'conf',
      render: (v) => confidenceTag(v),
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      render: (v) => <Tag>{v}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openEditMenuItem(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete this menu item permanently?"
            description="This cannot be undone."
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={async () => {
              try {
                await archiveMenuItem(record.id);
                message.success('Menu item deleted');
                refresh(['dashboard', 'menu']);
              } catch (err) {
                message.error(err?.response?.data?.error || 'Failed to delete menu item');
              }
            }}
          >
            <Button size="small" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const dashboardSortField = dashboardMenuOrdering.replace(/^-/, '');
  const dashboardSortOrder = dashboardMenuOrdering.startsWith('-')
    ? 'descend'
    : 'ascend';

  const dashboardMenuColumns = [
    {
      title: 'Item',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      sortOrder: dashboardSortField === 'name' ? dashboardSortOrder : null,
      sortDirections: ['ascend', 'descend', 'ascend'],
      render: (name, record) => (
        <button
          type="button"
          className="text-left font-medium text-[#FF8132] hover:underline bg-transparent border-0 p-0 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            goToMenuItem(record);
          }}
        >
          {name}
        </button>
      ),
    },
    {
      title: 'Selling price',
      dataIndex: 'selling_price',
      key: 'selling_price',
      sorter: true,
      sortOrder: dashboardSortField === 'selling_price' ? dashboardSortOrder : null,
      sortDirections: ['ascend', 'descend', 'ascend'],
      render: (v) => `$${Number(v || 0).toFixed(2)}`,
    },
    {
      title: 'Food cost %',
      key: 'food_cost_percent',
      sorter: true,
      sortOrder: dashboardSortField === 'food_cost_percent' ? dashboardSortOrder : null,
      sortDirections: ['ascend', 'descend', 'ascend'],
      render: (_, r) =>
        r.current_recipe?.food_cost_percent != null
          ? `${Number(r.current_recipe.food_cost_percent).toFixed(1)}%`
          : '—',
    },
    {
      title: 'Confidence',
      dataIndex: 'confidence_score',
      key: 'confidence_score',
      sorter: true,
      sortOrder: dashboardSortField === 'confidence_score' ? dashboardSortOrder : null,
      sortDirections: ['ascend', 'descend', 'ascend'],
      render: (v) => confidenceTag(v),
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      sorter: true,
      sortOrder: dashboardSortField === 'source' ? dashboardSortOrder : null,
      sortDirections: ['ascend', 'descend', 'ascend'],
      render: (v) => <Tag>{v}</Tag>,
    },
  ];

  const menuItemExpandable = {
    expandedRowRender: (record) => (
      <div className="text-sm text-gray-600 space-y-1">
        {(record.improvement_suggestions || []).length === 0 ? (
          <p>No improvement suggestions.</p>
        ) : (
          (record.improvement_suggestions || []).map((tip, idx) => (
            <p key={idx}>• {tip}</p>
          ))
        )}
      </div>
    ),
  };

  const categoryColumns = [
    { title: 'Category', dataIndex: 'category', key: 'category' },
    {
      title: 'Items',
      dataIndex: 'count',
      key: 'count',
      width: 120,
    },
  ];

  return (
    <div className="p-2 md:p-4">
      <PageHeaderSection
        title="Menu Intelligence"
        description={
          <>
            Growlio tells you how your restaurant is performing.
            <br />
            Menu Intelligence tells you how your menu is performing.
          </>
        }
        right={
          <Space wrap>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                refresh(['dashboard']);
                loadTabData(activeTab);
              }}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<CameraOutlined />}
              className="!bg-[#FF8132] hover:!bg-[#EB5B00] border-none"
              onClick={() => {
                setPhotoModalOpen(true);
                setDraftResult(null);
                setDraftLines([]);
                setPhotoFile(null);
              }}
            >
              Build from Photo with LIO
            </Button>
            <Button
              icon={<UploadOutlined />}
              onClick={async () => {
                await ensureModalData();
                invoiceForm.resetFields();
                setInvoiceFile(null);
                setExtractWithAi(true);
                setInvoiceModalOpen(true);
              }}
            >
              Upload invoice
            </Button>
          </Space>
        }
      />

      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        destroyInactiveTabPane
        items={[
          {
            key: 'dashboard',
            label: 'Dashboard',
            children: (
              <Spin spinning={loading}>
                <Row gutter={[16, 16]} className="mb-6">
                  {kpiCards.map((card) => (
                    <Col xs={24} sm={12} lg={8} xl={4} key={card.title}>
                      <Card className="shadow-sm border border-gray-100">
                        <p className="text-gray-500 text-sm mb-1">{card.title}</p>
                        <p className="text-2xl font-semibold text-[#FF8132]">
                          {card.value}
                        </p>
                      </Card>
                    </Col>
                  ))}
                </Row>
                <Card title="Menu items by confidence" className="shadow-sm">
                  <Table
                    rowKey="id"
                    loading={loading}
                    dataSource={dashboardMenuItems}
                    columns={dashboardMenuColumns}
                    pagination={{
                      current: dashboardMenuPage,
                      pageSize: dashboardMenuPageSize,
                      total: dashboardMenuTotal,
                      showSizeChanger: false,
                    }}
                    onChange={handleDashboardMenuTableChange}
                    onRow={(record) => ({
                      onClick: () => goToMenuItem(record),
                      className: 'cursor-pointer',
                    })}
                  />
                </Card>
              </Spin>
            ),
          },
          {
            key: 'drafts',
            label: `Drafts${
              (dashboard?.pending_drafts ?? draftTotal)
                ? ` (${dashboard?.pending_drafts ?? draftTotal})`
                : ''
            }`,
            children: (
              <Card
                className="shadow-sm"
                title="Pending LIO drafts"
                extra={
                  <Button
                    type="primary"
                    icon={<CameraOutlined />}
                    className="!bg-[#FF8132] hover:!bg-[#EB5B00] border-none"
                    onClick={() => {
                      setPhotoModalOpen(true);
                      setDraftResult(null);
                      setDraftLines([]);
                      setPhotoFile(null);
                    }}
                  >
                    Build from Photo
                  </Button>
                }
              >
                <Alert
                  className="mb-4"
                  type="info"
                  showIcon
                  message="Drafts from Food Costing photo builds and Lio chat appear here until you confirm or discard them."
                />
                <Table
                  rowKey="id"
                  loading={loading}
                  dataSource={drafts}
                  pagination={{
                    current: draftPage,
                    pageSize: 20,
                    total: draftTotal,
                    showSizeChanger: false,
                    onChange: (page) => loadTabData('drafts', { page }),
                  }}
                  locale={{
                    emptyText:
                      'No pending drafts. Build from a photo here or attach a plate photo in Lio chat.',
                  }}
                  expandable={{
                    expandedRowRender: (record) => (
                      <Table
                        size="small"
                        pagination={false}
                        rowKey="id"
                        dataSource={record.lines || []}
                        columns={[
                          { title: 'Ingredient', dataIndex: 'name', key: 'name' },
                          {
                            title: 'Portion',
                            key: 'portion',
                            render: (_, line) =>
                              `${line.suggested_portion} ${line.unit}`,
                          },
                          {
                            title: 'Type',
                            dataIndex: 'line_type',
                            key: 'type',
                            render: (v) => <Tag>{v}</Tag>,
                          },
                          {
                            title: 'Confidence',
                            dataIndex: 'confidence',
                            key: 'conf',
                          },
                        ]}
                      />
                    ),
                  }}
                  columns={[
                    {
                      title: 'Menu item',
                      dataIndex: 'menu_item_name_guess',
                      key: 'name',
                      render: (v) => v || 'Untitled draft',
                    },
                    {
                      title: 'Source',
                      dataIndex: 'source',
                      key: 'source',
                      width: 120,
                      render: (v) => (
                        <Tag color={v === 'lio' ? 'purple' : 'blue'}>
                          {v === 'lio' ? 'Lio chat' : 'Photo build'}
                        </Tag>
                      ),
                    },
                    {
                      title: 'Ingredients',
                      key: 'lines',
                      width: 110,
                      render: (_, r) => (r.lines || []).length,
                    },
                    {
                      title: 'Confidence',
                      dataIndex: 'starting_confidence_score',
                      key: 'conf',
                      render: (v) => confidenceTag(v),
                    },
                    {
                      title: 'Created',
                      dataIndex: 'created_at',
                      key: 'created',
                      render: (v) =>
                        v ? new Date(v).toLocaleString() : '—',
                    },
                    {
                      title: 'Actions',
                      key: 'actions',
                      render: (_, record) => (
                        <Space wrap>
                          <Button
                            size="small"
                            type="primary"
                            className="!bg-[#FF8132] border-none"
                            onClick={() => openDraftReview(record)}
                          >
                            Review & confirm
                          </Button>
                          <Popconfirm
                            title="Discard this draft?"
                            onConfirm={() => handleDiscardDraft(record.id)}
                          >
                            <Button size="small" danger>
                              Discard
                            </Button>
                          </Popconfirm>
                        </Space>
                      ),
                    },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'menu',
            label: 'Menu Items',
            children: (
              <Card
                className="shadow-sm"
                extra={
                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      className="w-36 [&_.ant-select-selector]:!h-8 [&_.ant-select-selector]:flex [&_.ant-select-selector]:items-center"
                      value={menuSortBy}
                      onChange={handleMenuSortByChange}
                      options={[
                        { value: 'item', label: 'Menu item' },
                        { value: 'category', label: 'Category' },
                      ]}
                    />
                    <AutoComplete
                      className="w-56 sm:w-64 [&_.ant-select-selector]:!h-8 [&_.ant-select-selector]:!py-0 [&_.ant-select-selector]:flex [&_.ant-select-selector]:items-center"
                      options={menuItemSearchOptions}
                      value={menuItemSearch}
                      onChange={setMenuItemSearch}
                      onSelect={setMenuItemSearch}
                      allowClear
                    >
                      <Input.Search
                        allowClear
                        placeholder="Search menu items…"
                        className="h-8"
                      />
                    </AutoComplete>
                    <Button
                      className="h-8"
                      icon={<CameraOutlined />}
                      loading={scanningPrintedMenu}
                      onClick={() => {
                        setMenuScanFile(null);
                        setMenuScanResult(null);
                        setMenuScanModalOpen(true);
                      }}
                    >
                      Scan printed menu with LIO
                    </Button>
                    <Button
                      className="h-8"
                      icon={<ReloadOutlined />}
                      loading={importingMenuFromSquare}
                      onClick={handleImportMenuFromSquare}
                    >
                      Fetch from POS
                    </Button>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      className="h-8 !bg-[#FF8132] hover:!bg-[#EB5B00] border-none"
                      onClick={openCreateMenuItem}
                    >
                      Add menu item
                    </Button>
                  </div>
                }
              >
                {menuSortBy === 'category' ? (
                  <Table
                    rowKey="key"
                    loading={loading || loadingCategoryMenu}
                    dataSource={paginatedCategoryGroups}
                    columns={categoryColumns}
                    pagination={{
                      current: categoryPage,
                      pageSize: categoryPageSize,
                      total: menuItemsByCategory.length,
                      showSizeChanger: true,
                      pageSizeOptions: ['5', '10', '20', '50'],
                      onChange: (page, pageSize) => {
                        setCategoryPage(page);
                        if (pageSize) setCategoryPageSize(pageSize);
                      },
                    }}
                    expandable={{
                      expandedRowRender: (group) => (
                        <Table
                          rowKey="id"
                          size="small"
                          dataSource={group.items}
                          columns={menuColumns}
                          pagination={false}
                          expandable={menuItemExpandable}
                        />
                      ),
                    }}
                  />
                ) : (
                  <Table
                    rowKey="id"
                    loading={loading}
                    dataSource={filteredMenuItems}
                    columns={menuColumns}
                    pagination={{
                      current: menuPage,
                      pageSize: menuPageSize,
                      total: menuTotal,
                      showSizeChanger: true,
                      onChange: handleMenuPageChange,
                    }}
                    expandable={menuItemExpandable}
                  />
                )}
              </Card>
            ),
          },
          {
            key: 'vendors',
            label: `Vendors${vendors.length ? ` (${vendors.length})` : ''}`,
            children: (
              <Card
                className="shadow-sm"
                title="Vendors"
                extra={
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    className="!bg-[#FF8132] hover:!bg-[#EB5B00] border-none"
                    onClick={openCreateVendor}
                  >
                    Add vendor
                  </Button>
                }
              >
                <Alert
                  className="mb-4"
                  type="info"
                  showIcon
                  message="Vendors are used on ingredients and invoices (Sysco, US Foods, local suppliers, etc.)."
                />
                <Table
                  rowKey="id"
                  loading={loading}
                  dataSource={vendors}
                  pagination={{ pageSize: 10 }}
                  locale={{ emptyText: 'No vendors yet. Add your suppliers here.' }}
                  columns={[
                    { title: 'Name', dataIndex: 'name', key: 'name' },
                    {
                      title: 'Ingredients',
                      key: 'ings',
                      width: 120,
                      render: (_, record) =>
                        ingredients.filter((ing) => ing.vendor === record.id).length,
                    },
                    {
                      title: 'Invoices',
                      key: 'inv',
                      width: 100,
                      render: (_, record) =>
                        invoices.filter((inv) => inv.vendor === record.id).length,
                    },
                    {
                      title: 'Created',
                      dataIndex: 'created_at',
                      key: 'created',
                      render: (v) => (v ? new Date(v).toLocaleString() : '—'),
                    },
                    {
                      title: 'Actions',
                      key: 'actions',
                      render: (_, record) => (
                        <Space>
                          <Button size="small" onClick={() => openEditVendor(record)}>
                            Edit
                          </Button>
                          <Popconfirm
                            title="Archive this vendor?"
                            onConfirm={async () => {
                              await archiveVendor(record.id);
                              message.success('Vendor archived');
                              refresh(['vendors']);
                            }}
                          >
                            <Button size="small" danger>
                              Archive
                            </Button>
                          </Popconfirm>
                        </Space>
                      ),
                    },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'invoices',
            label: `Invoices${
              invoices.filter((i) =>
                ['pending_review', 'partially_matched'].includes(i.status)
              ).length
                ? ` (${
                    invoices.filter((i) =>
                      ['pending_review', 'partially_matched'].includes(i.status)
                    ).length
                  })`
                : ''
            }`,
            children: (
              <Card
                className="shadow-sm"
                title="Vendor invoices"
                extra={
                  <Button
                    type="primary"
                    icon={<UploadOutlined />}
                    className="!bg-[#FF8132] hover:!bg-[#EB5B00] border-none"
                    onClick={() => {
                      invoiceForm.resetFields();
                      setInvoiceFile(null);
                      setExtractWithAi(true);
                      setInvoiceModalOpen(true);
                    }}
                  >
                    Upload invoice
                  </Button>
                }
              >
                <Alert
                  className="mb-4"
                  type="info"
                  showIcon
                  message="Upload a vendor invoice photo (LIO can extract lines) or enter lines manually. Match ingredients, then apply costs."
                />
                <Table
                  rowKey="id"
                  loading={loading}
                  dataSource={invoices}
                  pagination={{
                    current: invoicePage,
                    pageSize: 20,
                    total: invoiceTotal,
                    showSizeChanger: false,
                    onChange: (page) => loadTabData('invoices', { page }),
                  }}
                  locale={{ emptyText: 'No invoices yet. Upload one to update ingredient costs.' }}
                  expandable={{
                    expandedRowRender: (record) => (
                      <Table
                        size="small"
                        pagination={false}
                        rowKey="id"
                        dataSource={record.lines || []}
                        columns={[
                          { title: 'Line item', dataIndex: 'raw_name', key: 'raw' },
                          {
                            title: 'Matched ingredient',
                            dataIndex: 'ingredient_name',
                            key: 'ing',
                            render: (v) => v || <Tag color="orange">Unmatched</Tag>,
                          },
                          {
                            title: 'Weight',
                            key: 'wt',
                            render: (_, line) =>
                              line.actual_weight != null
                                ? `${line.actual_weight} ${line.actual_weight_unit || ''}`
                                : '—',
                          },
                          {
                            title: 'Total',
                            dataIndex: 'total_cost',
                            key: 'cost',
                            render: (v) => `$${Number(v || 0).toFixed(2)}`,
                          },
                          {
                            title: 'Review',
                            dataIndex: 'needs_review',
                            key: 'rev',
                            render: (v) =>
                              v ? <Tag color="orange">Needs review</Tag> : <Tag color="green">OK</Tag>,
                          },
                        ]}
                      />
                    ),
                  }}
                  columns={[
                    {
                      title: 'Invoice #',
                      dataIndex: 'invoice_number',
                      key: 'num',
                      render: (v) => v || '—',
                    },
                    {
                      title: 'Vendor',
                      dataIndex: 'vendor_name',
                      key: 'vendor',
                      render: (v) => v || '—',
                    },
                    {
                      title: 'Date',
                      dataIndex: 'invoice_date',
                      key: 'date',
                      render: (v) => v || '—',
                    },
                    {
                      title: 'Lines',
                      key: 'lines',
                      width: 80,
                      render: (_, r) => (r.lines || []).length,
                    },
                    {
                      title: 'Status',
                      dataIndex: 'status',
                      key: 'status',
                      render: (v) => {
                        const color =
                          v === 'matched'
                            ? 'green'
                            : v === 'partially_matched'
                              ? 'orange'
                              : 'blue';
                        return <Tag color={color}>{String(v || '').replaceAll('_', ' ')}</Tag>;
                      },
                    },
                    {
                      title: 'Created',
                      dataIndex: 'created_at',
                      key: 'created',
                      render: (v) => (v ? new Date(v).toLocaleString() : '—'),
                    },
                    {
                      title: 'Actions',
                      key: 'actions',
                      render: (_, record) => (
                        <Space wrap>
                          <Button
                            size="small"
                            type="primary"
                            className="!bg-[#FF8132] border-none"
                            onClick={() => openInvoiceReview(record)}
                          >
                            Review & apply
                          </Button>
                          <Popconfirm
                            title="Discard this invoice?"
                            onConfirm={async () => {
                              await discardInvoice(record.id);
                              message.success('Invoice discarded');
                              refresh(['dashboard', 'invoices']);
                            }}
                          >
                            <Button size="small" danger>
                              Discard
                            </Button>
                          </Popconfirm>
                        </Space>
                      ),
                    },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'ingredients',
            label: 'Ingredients',
            children: (
              <Card
                className="shadow-sm"
                extra={
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    className="!bg-[#FF8132] hover:!bg-[#EB5B00] border-none"
                    onClick={openCreateIngredient}
                  >
                    Add ingredient
                  </Button>
                }
              >
                <div className="mb-4 flex flex-wrap gap-3">
                  <Input.Search
                    allowClear
                    placeholder="Search ingredients…"
                    className="max-w-xs"
                    value={ingredientSearch}
                    onChange={(e) => setIngredientSearch(e.target.value)}
                  />
                  <Select
                    allowClear
                    placeholder="Category"
                    className="min-w-[160px]"
                    value={ingredientCategory || undefined}
                    onChange={(v) => setIngredientCategory(v || '')}
                    options={[
                      ...Array.from(
                        new Set(
                          ingredients
                            .map((i) => i.category)
                            .filter(Boolean)
                        )
                      ),
                    ].map((c) => ({ value: c, label: c }))}
                  />
                  <Select
                    className="min-w-[180px]"
                    value={ingredientOrdering}
                    onChange={setIngredientOrdering}
                    options={[
                      { value: 'name', label: 'Sort: Name A–Z' },
                      { value: '-name', label: 'Sort: Name Z–A' },
                      { value: 'category', label: 'Sort: Category A–Z' },
                      { value: '-category', label: 'Sort: Category Z–A' },
                      {
                        value: 'cost_per_standardized_unit',
                        label: 'Sort: Cost low→high',
                      },
                      {
                        value: '-cost_per_standardized_unit',
                        label: 'Sort: Cost high→low',
                      },
                    ]}
                  />
                </div>
                <Table
                  rowKey="id"
                  loading={loading}
                  dataSource={ingredients}
                  columns={ingredientColumns}
                  pagination={{
                    current: ingredientPage,
                    pageSize: ingredientPageSize,
                    total: ingredientTotal,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '25', '50'],
                    onChange: handleIngredientPageChange,
                  }}
                />
              </Card>
            ),
          },
          {
            key: 'simulator',
            label: 'Simulator',
            children:
              activeTab === 'simulator' ? <MenuProfitabilitySimulator /> : null,
          },
        ]}
      />

      <IngredientEntryModal
        open={ingredientModalOpen}
        editingIngredient={editingIngredient}
        ingredients={ingredients}
        vendors={vendors}
        onCancel={() => {
          setIngredientModalOpen(false);
          setEditingIngredient(null);
        }}
        saveIngredient={persistIngredient}
        onVendorsChanged={() => refresh(['vendors'])}
        onSaved={(result) => {
          if (result?.useExisting) {
            setEditingIngredient(result.useExisting);
            return;
          }
          setIngredientModalOpen(false);
          setEditingIngredient(null);
          refresh(['dashboard', 'ingredients', 'menu']);
        }}
      />

      {/* Menu item modal */}
      <Modal
        title={editingMenuItem ? 'Edit menu item' : 'Add menu item'}
        open={menuModalOpen}
        onCancel={() => setMenuModalOpen(false)}
        onOk={saveMenuItem}
        okText="Save"
        width={720}
        okButtonProps={{ className: '!bg-[#FF8132] border-none' }}
        destroyOnClose
      >
        <Form form={menuForm} layout="vertical" className="mt-4">
          <Form.Item
            name="name"
            label="Menu item name"
            rules={[{ required: true, message: 'Name is required' }]}
          >
            <Input placeholder="Margherita Pizza" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="category" label="Category">
                <Input placeholder="Pizza" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="selling_price" label="Selling price">
                <InputNumber
                  className="w-full"
                  min={0}
                  step={0.01}
                  precision={2}
                  stringMode
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.List name="recipe_lines">
            {(fields, { add, remove }) => (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium m-0">Recipe lines</p>
                  <Button size="small" icon={<PlusOutlined />} onClick={() => add(emptyRecipeLine())}>
                    Add line
                  </Button>
                </div>
                {fields.map((field) => (
                  <Row gutter={8} key={field.key} align="middle">
                    <Col span={8}>
                      <Form.Item {...field} name={[field.name, 'ingredient_id']} hidden>
                        <Input />
                      </Form.Item>
                      <Form.Item
                        {...field}
                        name={[field.name, 'name']}
                        rules={[{ required: true, message: 'Required' }]}
                      >
                        <AutoComplete
                          allowClear
                          placeholder="Search or add ingredient"
                          options={recipeIngredientSelectOptions}
                          filterOption={(input, option) =>
                            String(option?.label || option?.value || '')
                              .toLowerCase()
                              .includes(String(input || '').toLowerCase())
                          }
                          onChange={(typed) => {
                            const source =
                              recipeIngredientChoices.length > 0
                                ? recipeIngredientChoices
                                : ingredients;
                            const match = source.find(
                              (item) =>
                                String(item.name || '').toLowerCase() ===
                                String(typed || '').trim().toLowerCase()
                            );
                            const lines = [
                              ...(menuForm.getFieldValue('recipe_lines') || []),
                            ];
                            const current = lines[field.name] || {};
                            lines[field.name] = {
                              ...current,
                              name: typed || '',
                              ingredient_id: match?.id,
                              ...(match?.standardized_unit
                                ? { unit: match.standardized_unit }
                                : {}),
                            };
                            menuForm.setFieldsValue({ recipe_lines: lines });
                          }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item
                        {...field}
                        name={[field.name, 'quantity']}
                        rules={[{ required: true, message: 'Required' }]}
                      >
                        <InputNumber className="w-full" min={0} step={0.1} placeholder="Qty" />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item {...field} name={[field.name, 'unit']}>
                        <Select options={UNIT_OPTIONS} />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item shouldUpdate noStyle>
                        {() => {
                          const lines = menuForm.getFieldValue('recipe_lines') || [];
                          const line = lines[field.name] || {};
                          const source =
                            recipeIngredientChoices.length > 0
                              ? recipeIngredientChoices
                              : ingredients;
                          const match = source.find(
                            (ing) =>
                              ing.id === line.ingredient_id ||
                              (line.name &&
                                ing.name.toLowerCase() ===
                                  String(line.name).toLowerCase())
                          );
                          const unitCost = match
                            ? Number(match.cost_per_standardized_unit || 0)
                            : 0;
                          const qty = qtyInCostUnit(
                            line.quantity,
                            line.unit,
                            match?.standardized_unit
                          );
                          const lineCost = unitCost * qty;
                          if (!match) {
                            return line.name ? (
                              <Tag color="blue">New ingredient</Tag>
                            ) : (
                              <Tag color="orange">Needs pricing</Tag>
                            );
                          }
                          return (
                            <span className="text-xs text-gray-600">
                              ${lineCost.toFixed(2)}
                              {match.is_estimated_cost || unitCost <= 0 ? (
                                <Tag color="orange" className="ml-1">
                                  Review
                                </Tag>
                              ) : null}
                            </span>
                          );
                        }}
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Button danger type="link" onClick={() => remove(field.name)}>
                        Remove
                      </Button>
                    </Col>
                  </Row>
                ))}
              </div>
            )}
          </Form.List>
        </Form>
      </Modal>

      {/* Photo draft modal */}
      <Modal
        title="Build from Photo with LIO"
        open={photoModalOpen}
        onCancel={() => setPhotoModalOpen(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Alert
          className="mb-4"
          type="info"
          showIcon
          message="LIO builds a draft only. Confirm before it becomes official costing data."
        />
        {!draftResult ? (
          <div className="space-y-4">
            <Input
              placeholder="Optional menu item name hint"
              value={photoMenuName}
              onChange={(e) => setPhotoMenuName(e.target.value)}
            />
            <Upload
              beforeUpload={(file) => handleImageFileSelect(file, setPhotoFile)}
              maxCount={1}
              accept="image/*"
              onRemove={() => setPhotoFile(null)}
            >
              <Button icon={<UploadOutlined />}>Upload or take photo</Button>
            </Upload>
            <p className="text-xs text-gray-500 m-0">
              Max file size: {MAX_IMAGE_UPLOAD_MB} MB
            </p>
            {photoFile ? (
              <p className="text-sm text-gray-600">Selected: {photoFile.name}</p>
            ) : null}
            <Button
              type="primary"
              loading={buildingDraft}
              icon={<CameraOutlined />}
              className="!bg-[#FF8132] hover:!bg-[#EB5B00] border-none"
              onClick={handleBuildFromPhoto}
            >
              Analyze with LIO
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <p className="font-semibold text-lg m-0">
                  {draftResult.draft?.menu_item_name_guess || 'Draft recipe'}
                </p>
                <p className="text-sm text-gray-500 m-0">
                  Starting confidence:{' '}
                  {draftResult.draft?.starting_confidence_score}% · AI builds{' '}
                  {draftResult.ai_builds_used}/{draftResult.ai_builds_limit}
                </p>
                <p className="text-sm text-gray-600 m-0 mt-1">
                  Est. plate cost: $
                  {Number(
                    draftResult.draft?.estimated_plate_cost ??
                      draftLines.reduce(
                        (sum, line) =>
                          sum +
                          (line.exclude
                            ? 0
                            : Number(line.line_cost_estimate || 0)),
                        0
                      )
                  ).toFixed(2)}{' '}
                  ·{' '}
                  {
                    draftLines.filter(
                      (line) => !line.exclude && line.needs_pricing
                    ).length
                  }{' '}
                  ingredient(s) need pricing
                </p>
              </div>
              <Tag icon={<CheckCircleOutlined />} color="processing">
                Draft pending review
              </Tag>
            </div>

            <div className="max-w-xs">
              <p className="text-sm font-medium mb-1">Selling price</p>
              <InputNumber
                className="w-full"
                min={0}
                step={0.01}
                precision={2}
                stringMode
                value={draftSellingPrice}
                onChange={(v) => setDraftSellingPrice(v ?? '0.00')}
              />
            </div>

            {(draftResult.draft?.questions_for_user || []).length > 0 ? (
              <Alert
                type="warning"
                showIcon
                message="Questions from LIO"
                description={
                  <ul className="mb-0 pl-4">
                    {(draftResult.draft.questions_for_user || []).map((q, idx) => (
                      <li key={idx}>{q}</li>
                    ))}
                  </ul>
                }
              />
            ) : null}

            <Table
              rowKey="draft_line_id"
              size="small"
              pagination={false}
              dataSource={draftLines}
              columns={[
                {
                  title: 'Ingredient',
                  dataIndex: 'name',
                  render: (value, record, index) => (
                    <Input
                      value={value}
                      onChange={(e) => {
                        const next = [...draftLines];
                        next[index] = { ...record, name: e.target.value };
                        setDraftLines(next);
                      }}
                    />
                  ),
                },
                {
                  title: 'Portion',
                  dataIndex: 'quantity',
                  width: 110,
                  render: (value, record, index) => (
                    <InputNumber
                      className="w-full"
                      min={0}
                      step={0.1}
                      value={value}
                      onChange={(val) => {
                        const next = [...draftLines];
                        next[index] = { ...record, quantity: val };
                        setDraftLines(next);
                      }}
                    />
                  ),
                },
                {
                  title: 'Unit',
                  dataIndex: 'unit',
                  width: 100,
                  render: (value, record, index) => (
                    <Select
                      className="w-full"
                      value={value}
                      options={UNIT_OPTIONS}
                      onChange={(val) => {
                        const next = [...draftLines];
                        next[index] = { ...record, unit: val };
                        setDraftLines(next);
                      }}
                    />
                  ),
                },
                {
                  title: 'Type',
                  dataIndex: 'line_type',
                  width: 100,
                  render: (v) => <Tag>{v}</Tag>,
                },
                {
                  title: 'Match',
                  key: 'match',
                  width: 130,
                  render: (_, record) =>
                    record.matched_ingredient_name ? (
                      <Tag color="blue">{record.matched_ingredient_name}</Tag>
                    ) : (
                      <Tag color="orange">New</Tag>
                    ),
                },
                {
                  title: 'Unit cost',
                  key: 'unit_cost',
                  width: 100,
                  render: (_, record) =>
                    record.cost_per_standardized_unit != null
                      ? `$${Number(record.cost_per_standardized_unit).toFixed(4)}`
                      : '—',
                },
                {
                  title: 'Est. cost',
                  key: 'est_cost',
                  width: 90,
                  render: (_, record) =>
                    record.line_cost_estimate != null
                      ? `$${Number(record.line_cost_estimate).toFixed(2)}`
                      : '—',
                },
                {
                  title: 'Pricing',
                  key: 'pricing',
                  width: 110,
                  render: (_, record) =>
                    record.needs_pricing ? (
                      <Tag color="orange">Needs pricing</Tag>
                    ) : (
                      <Tag color="green">Priced</Tag>
                    ),
                },
                {
                  title: 'Keep',
                  dataIndex: 'exclude',
                  width: 80,
                  render: (value, record, index) => (
                    <Select
                      value={!value}
                      options={[
                        { value: true, label: 'Yes' },
                        { value: false, label: 'No' },
                      ]}
                      onChange={(keep) => {
                        const next = [...draftLines];
                        next[index] = { ...record, exclude: !keep };
                        setDraftLines(next);
                      }}
                    />
                  ),
                },
              ]}
            />

            <Space>
              <Button
                type="primary"
                loading={confirmingDraft}
                className="!bg-[#FF8132] hover:!bg-[#EB5B00] border-none"
                onClick={handleConfirmDraft}
              >
                Confirm & save recipe
              </Button>
              <Popconfirm
                title="Discard this draft?"
                onConfirm={() => handleDiscardDraft(draftResult.draft.id)}
              >
                <Button danger>Discard draft</Button>
              </Popconfirm>
              <Button
                onClick={() => {
                  setDraftResult(null);
                  setDraftLines([]);
                }}
              >
                Analyze another photo
              </Button>
            </Space>
          </div>
        )}
      </Modal>

      {/* Vendor modal */}
      <Modal
        title={editingVendor ? 'Edit vendor' : 'Add vendor'}
        open={vendorModalOpen}
        onCancel={() => setVendorModalOpen(false)}
        onOk={saveVendor}
        okText="Save"
        confirmLoading={savingVendor}
        okButtonProps={{ className: '!bg-[#FF8132] border-none' }}
        destroyOnClose
      >
        <Form form={vendorForm} layout="vertical" className="mt-4">
          <Form.Item
            name="name"
            label="Vendor name"
            rules={[{ required: true, message: 'Vendor name is required' }]}
          >
            <Input placeholder="Sysco / US Foods / Local butcher" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Upload invoice modal */}
      <Modal
        title="Upload vendor invoice"
        open={invoiceModalOpen}
        onCancel={() => setInvoiceModalOpen(false)}
        onOk={handleCreateInvoice}
        okText="Save invoice"
        confirmLoading={savingInvoice}
        okButtonProps={{ className: '!bg-[#FF8132] border-none' }}
        width={720}
        destroyOnClose
      >
        <Alert
          className="mb-4"
          type="info"
          showIcon
          message="LIO can read invoice photos and create draft line items. You still review and apply costs."
        />
        <Form
          form={invoiceForm}
          layout="vertical"
          initialValues={{
            lines: [{ raw_name: '', total_cost: 0, actual_weight_unit: 'lb' }],
          }}
        >
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="vendor_id" label="Existing vendor">
                <Select
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  placeholder="Select vendor"
                  options={vendors.map((v) => ({ value: v.id, label: v.name }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="vendor_name" label="Or new vendor name">
                <Input placeholder="Sysco / US Foods / Local" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="invoice_number" label="Invoice #">
                <Input placeholder="Optional" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="invoice_date" label="Invoice date (YYYY-MM-DD)">
                <Input placeholder="2026-07-23" />
              </Form.Item>
            </Col>
          </Row>
          <div className="mb-4 space-y-2">
            <Upload
              beforeUpload={(file) => handleFileSelect(file, setInvoiceFile)}
              maxCount={1}
              accept={ACCEPT_IMAGE_OR_PDF}
              onRemove={() => setInvoiceFile(null)}
            >
              <Button icon={<UploadOutlined />}>Upload invoice photo or PDF</Button>
            </Upload>
            <p className="text-xs text-gray-500 m-0">
              Max file size: {MAX_FILE_UPLOAD_MB} MB · PNG, JPG, or PDF
            </p>
            {invoiceFile ? (
              <p className="text-sm text-gray-600 m-0">Selected: {invoiceFile.name}</p>
            ) : null}
            <Select
              className="w-full"
              value={extractWithAi}
              onChange={setExtractWithAi}
              options={[
                {
                  value: true,
                  label: 'Extract lines with LIO (recommended for photos/PDFs)',
                },
                { value: false, label: 'Do not extract — use manual lines only' },
              ]}
            />
          </div>
          <Form.List name="lines">
            {(fields, { add, remove }) => (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium m-0">Manual lines (optional if using AI extract)</p>
                  <Button size="small" onClick={() => add({ actual_weight_unit: 'lb', total_cost: 0 })}>
                    Add line
                  </Button>
                </div>
                {fields.map((field) => (
                  <Row gutter={8} key={field.key} align="middle">
                    <Col span={10}>
                      <Form.Item {...field} name={[field.name, 'raw_name']} className="mb-2">
                        <Input placeholder="Item name" />
                      </Form.Item>
                    </Col>
                    <Col span={5}>
                      <Form.Item {...field} name={[field.name, 'actual_weight']} className="mb-2">
                        <InputNumber className="w-full" min={0} placeholder="Weight" />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item
                        {...field}
                        name={[field.name, 'actual_weight_unit']}
                        className="mb-2"
                      >
                        <Select
                          options={[
                            { value: 'lb', label: 'lb' },
                            { value: 'oz', label: 'oz' },
                            { value: 'kg', label: 'kg' },
                            { value: 'each', label: 'each' },
                          ]}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item {...field} name={[field.name, 'total_cost']} className="mb-2">
                        <InputNumber className="w-full" min={0} step={0.01} placeholder="Cost" />
                      </Form.Item>
                    </Col>
                    <Col span={1}>
                      <Button type="link" danger onClick={() => remove(field.name)}>
                        ×
                      </Button>
                    </Col>
                  </Row>
                ))}
              </div>
            )}
          </Form.List>
        </Form>
      </Modal>

      {/* Invoice review modal */}
      <Modal
        title={
          selectedInvoice
            ? `Review invoice ${selectedInvoice.invoice_number || `#${selectedInvoice.id}`}`
            : 'Review invoice'
        }
        open={invoiceReviewOpen}
        onCancel={() => setInvoiceReviewOpen(false)}
        width={960}
        footer={null}
        destroyOnClose
      >
        {selectedInvoice ? (
          <div className="space-y-4">
            <Alert
              type="info"
              showIcon
              message={`${selectedInvoice.vendor_name || 'Vendor'} · status: ${String(
                selectedInvoice.status || ''
              ).replaceAll('_', ' ')}`}
            />
            <Table
              rowKey="id"
              size="small"
              pagination={false}
              dataSource={invoiceLines}
              scroll={{ x: 1200 }}
              columns={[
                {
                  title: 'Invoice item',
                  dataIndex: 'raw_name',
                  width: 180,
                  render: (value, record, index) => (
                    <Input
                      value={value}
                      onChange={(e) => {
                        const next = [...invoiceLines];
                        next[index] = { ...record, raw_name: e.target.value };
                        setInvoiceLines(next);
                      }}
                    />
                  ),
                },
                {
                  title: 'Match ingredient',
                  dataIndex: 'ingredient_id',
                  width: 200,
                  render: (value, record, index) => (
                    <Select
                      allowClear
                      showSearch
                      className="w-full"
                      placeholder="Select ingredient"
                      optionFilterProp="label"
                      value={value || undefined}
                      options={ingredients.map((ing) => ({
                        value: ing.id,
                        label: ing.name,
                      }))}
                      onChange={(val) => {
                        const next = [...invoiceLines];
                        next[index] = { ...record, ingredient_id: val || null };
                        setInvoiceLines(next);
                      }}
                    />
                  ),
                },
                {
                  title: 'Weight',
                  dataIndex: 'actual_weight',
                  width: 100,
                  render: (value, record, index) => (
                    <InputNumber
                      className="w-full"
                      controls={false}
                      min={0}
                      value={value}
                      onChange={(val) => {
                        const next = [...invoiceLines];
                        next[index] = { ...record, actual_weight: val };
                        setInvoiceLines(next);
                      }}
                    />
                  ),
                },
                {
                  title: 'Unit',
                  dataIndex: 'actual_weight_unit',
                  width: 90,
                  render: (value, record, index) => (
                    <Select
                      className="w-full"
                      value={value || 'lb'}
                      options={[
                        { value: 'lb', label: 'lb' },
                        { value: 'oz', label: 'oz' },
                        { value: 'kg', label: 'kg' },
                        { value: 'each', label: 'each' },
                      ]}
                      onChange={(val) => {
                        const next = [...invoiceLines];
                        next[index] = { ...record, actual_weight_unit: val };
                        setInvoiceLines(next);
                      }}
                    />
                  ),
                },
                {
                  title: 'Total $',
                  dataIndex: 'total_cost',
                  width: 150,
                  render: (value, record, index) => (
                    <InputNumber
                      className="w-full"
                      controls={false}
                      min={0}
                      step={0.01}
                      precision={2}
                      value={value}
                      onChange={(val) => {
                        const next = [...invoiceLines];
                        next[index] = { ...record, total_cost: val };
                        setInvoiceLines(next);
                      }}
                    />
                  ),
                },
                {
                  title: '$/oz',
                  dataIndex: 'cost_per_oz',
                  width: 100,
                  render: (v) =>
                    v != null ? `$${Number(v).toFixed(4)}` : '—',
                },
                {
                  title: 'Matched cost',
                  dataIndex: 'matched_unit_cost',
                  width: 120,
                  render: (v) =>
                    v != null ? `$${Number(v).toFixed(4)}` : '—',
                },
                {
                  title: 'Non-food',
                  dataIndex: 'is_non_food',
                  width: 90,
                  render: (value, record, index) => (
                    <Select
                      value={!!value}
                      options={[
                        { value: false, label: 'No' },
                        { value: true, label: 'Yes' },
                      ]}
                      onChange={(val) => {
                        const next = [...invoiceLines];
                        next[index] = { ...record, is_non_food: val };
                        setInvoiceLines(next);
                      }}
                    />
                  ),
                },
              ]}
            />
            <Space wrap>
              <Button loading={savingInvoice} onClick={handleSaveInvoiceLines}>
                Save matches
              </Button>
              <Button
                type="primary"
                loading={applyingInvoice}
                className="!bg-[#FF8132] hover:!bg-[#EB5B00] border-none"
                onClick={() => handleApplyInvoice(false)}
              >
                Apply costs to ingredients
              </Button>
              <Button loading={applyingInvoice} onClick={() => handleApplyInvoice(true)}>
                Apply + create missing ingredients
              </Button>
            </Space>
          </div>
        ) : null}
      </Modal>

      {/* Printed menu scan modal */}
      <Modal
        title="Scan printed menu with LIO"
        open={menuScanModalOpen}
        onCancel={() => {
          setMenuScanModalOpen(false);
          setMenuScanFile(null);
          setMenuScanResult(null);
        }}
        footer={null}
        width={720}
        destroyOnClose
      >
        <Alert
          className="mb-4"
          type="info"
          showIcon
          message="Upload a photo or PDF of a printed menu. LIO imports item names, prices, and categories — recipes are not invented."
        />
        {!menuScanResult ? (
          <div className="space-y-4">
            <Upload
              beforeUpload={(file) => handleFileSelect(file, setMenuScanFile)}
              maxCount={1}
              accept={ACCEPT_IMAGE_OR_PDF}
              onRemove={() => setMenuScanFile(null)}
            >
              <Button icon={<UploadOutlined />}>Upload menu photo or PDF</Button>
            </Upload>
            <p className="text-xs text-gray-500 m-0">
              Max file size: {MAX_FILE_UPLOAD_MB} MB · PNG, JPG, or PDF
            </p>
            {menuScanFile ? (
              <p className="text-sm text-gray-600">Selected: {menuScanFile.name}</p>
            ) : null}
            <Button
              type="primary"
              loading={scanningPrintedMenu}
              icon={<CameraOutlined />}
              className="!bg-[#FF8132] hover:!bg-[#EB5B00] border-none"
              onClick={handleScanPrintedMenu}
            >
              Scan with LIO
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert
              type="success"
              showIcon
              message={
                menuScanResult.message ||
                `Imported ${menuScanResult.created_count || 0} item(s).`
              }
            />
            <Table
              rowKey="id"
              size="small"
              pagination={false}
              dataSource={menuScanResult.items || []}
              columns={[
                { title: 'Item', dataIndex: 'name', key: 'name' },
                {
                  title: 'Category',
                  dataIndex: 'category',
                  key: 'category',
                  render: (v) => v || '—',
                },
                {
                  title: 'Price',
                  dataIndex: 'selling_price',
                  key: 'price',
                  render: (v) => `$${Number(v || 0).toFixed(2)}`,
                },
                {
                  title: 'Actions',
                  key: 'actions',
                  render: (_, record) => (
                    <Button
                      size="small"
                      type="primary"
                      className="!bg-[#FF8132] border-none"
                      onClick={() => {
                        setMenuScanModalOpen(false);
                        setMenuScanResult(null);
                        setMenuScanFile(null);
                        openEditMenuItem(record);
                      }}
                    >
                      Edit recipe
                    </Button>
                  ),
                },
              ]}
            />
            <Button
              onClick={() => {
                setMenuScanModalOpen(false);
                setMenuScanResult(null);
                setMenuScanFile(null);
                handleTabChange('menu');
              }}
            >
              Done
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FoodCostingPage;
