import './App.css';
import monthCounts from './month_counts.json';
import Heatmap from './Heapmap';

monthCounts.reverse();

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <Heatmap data={monthCounts} rowKey="buyer_name" colKey="tender_year_month" valKey="count" />
      </header>
    </div>
  );
}

export default App;
