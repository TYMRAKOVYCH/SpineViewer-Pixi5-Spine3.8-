import Vue from 'vue';
import {
  Button,
  ButtonGroup,
  Container,
  Main,
  Aside,
  Col,
  Row,
  Collapse,
  CollapseItem,
  Form,
  FormItem,
  Input,
  ColorPicker,
  Radio,
  RadioGroup,
  RadioButton,
  Select,
  Option,
  Tooltip,
  Alert,
  Switch,
  InputNumber,
  Slider,
  Cascader,
} from 'element-ui';
import lang from 'element-ui/lib/locale/lang/ua';
import locale from 'element-ui/lib/locale';

locale.use(lang);

Vue.use(Button);
Vue.use(ButtonGroup);
Vue.use(Container);
Vue.use(Main);
Vue.use(Aside);
Vue.use(Col);
Vue.use(Row);
Vue.use(Collapse);
Vue.use(CollapseItem);
Vue.use(Form);
Vue.use(FormItem);
Vue.use(Input);
Vue.use(ColorPicker);
Vue.use(Radio);
Vue.use(RadioGroup);
Vue.use(RadioButton);
Vue.use(Select);
Vue.use(Option);
Vue.use(Cascader);
Vue.use(Tooltip);
Vue.use(Alert);
Vue.use(Switch);
Vue.use(InputNumber);
Vue.use(Slider);
