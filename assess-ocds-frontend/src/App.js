import './App.css';
import monthCounts from './month_counts.json';
import Heatmap from './Heapmap';

function App() {
  const municipal = monthCounts.filter((x) => x.group === "municipality");
  const nationalDepartment = monthCounts.filter((x) => x.group === "national_department");
  const provincialDepartment = monthCounts.filter((x) => x.group === "provincial_department");
  const other = monthCounts.filter((x) => x.group === "other");

  return (
    <div className="App">
      <header className="App-header">
        <Section heading="National departments" data={nationalDepartment} />
        <Section heading="Provincial departments" data={provincialDepartment} />
        <Section heading="Municipalities" data={municipal} />
        <Section heading="Other buyers" data={other} />
      </header>
    </div>
  );
}

function Section({ heading, data }) {
  return <>
    <h1>{heading}</h1>
    <Heatmap data={data} rowKey="buyer_name" colKey="tender_year_month" valKey="count" />
  </>
}

export default App;
