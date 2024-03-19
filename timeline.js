import { Timeline, DataSet } from "vis-timeline/standalone";
import moment from "moment";
import cronParser from "cron-parser";
import "./styles.css";
import jobData from "./jobs.json";

export function generateTimeline() {
  // Set the locale to German
  moment.locale("de");

  // Get the app element
  const app = document.getElementById("app");

  // Generate job schedule data based on cron expressions
  function generateJobScheduleData(jobs) {
    let allJobData = [];
    jobs.forEach(job => {
      const interval = cronParser.parseExpression(job.cronExpression, {
        currentDate: customStartDate(),
        endDate: customEndDate()
      });
      const durationMs = parseDuration(job.duration);
      while (true) {
        try {
          const next = interval.next();
          let startingTime = next.toDate().getTime();
          let endingTime = startingTime + durationMs;
          allJobData.push({
            start: startingTime,
            end: endingTime,
            group: job.content,
            className: job.className,
            description: job.description
          });
        } catch (e) {
          break;
        }
      }
    });
    return allJobData;
  }

  // Parse duration in HH:mm:ss format to milliseconds
  function parseDuration(duration) {
    const [hours, minutes, seconds] = duration.split(":").map(Number);
    return ((hours * 60 + minutes) * 60 + seconds) * 1000;
  }

  // Get the custom start date
  function customStartDate() {
    return moment("2024-01-01").toDate();
  }

  // Get the custom end date
  function customEndDate() {
    return moment("2024-01-08").toDate();
  }

  // Create a dataset for groups
  var groups = new DataSet(jobData);

  // Create a dataset for items
  var items = new DataSet(generateJobScheduleData(jobData));

  // Set the container element
  var container = app;

  // Set the options for the timeline
  var options = {
    // Customize the group template
    groupTemplate: function (group) {
      const container = document.createElement('div');
      container.className = 'group-container';

      const logo = document.createElement('img');
      logo.className = 'group-logo';
      logo.src = VIS_GROUP_LOGO;
      logo.alt = 'Group Logo';

      const textContainer = document.createElement('div');
      textContainer.className = 'group-text';

      const titleLink = document.createElement('a');
      titleLink.className = 'group-title-link';
      titleLink.href = DAG_URI + group.id;
      titleLink.target = "_blank";
      titleLink.textContent = group.content;
      titleLink.style.textDecoration = "none";

      const description = document.createElement('div');
      description.className = 'group-description';
      description.textContent = group.description;

      textContainer.appendChild(titleLink);
      textContainer.appendChild(description);

      container.appendChild(logo);
      container.appendChild(textContainer);

      return container;
    },
    // Show the current time indicator
    showCurrentTime: true,
    // Customize the tooltip template
    tooltip: {
      template: function (item, element, data) {
        const start = moment(item.start).format('ddd HH:mm:ss');
        const end = moment(item.end).format('ddd HH:mm:ss');
        const duration = moment.duration(moment(item.end).diff(moment(item.start)));
        const durationFormatted = Math.floor(duration.asHours()) + moment.utc(duration.asMilliseconds()).format(":mm:ss");
        // Create the tooltip content
        return '<h3>Airflow DAG - ' + item.group + '</h3>' +
          '<p>' + item.description + '</p>' +
          '<p>Start: ' + start + '<br>' +
          'End: ' + end + '<br>' +
          'Duration: ' + durationFormatted + '</p>';
      },
    },
    // Customize the format of minor and major labels
    format: {
      minorLabels: {
        millisecond: 'SSS',
        second: 's',
        minute: 'HH:mm',
        hour: 'HH:mm',
        weekday: 'ddd',
        day: '',
        week: '',
        month: '',
        year: ''
      },
      majorLabels: {
        millisecond: 'HH:mm:ss',
        second: 'HH:mm:ss',
        minute: 'HH:mm',
        hour: 'ddd',
        weekday: '',
        day: '',
        week: '',
        month: '',
        year: ''
      }
    },
    // Set the orientation to both horizontal and vertical
    orientation: "both",
    // Show tooltips
    showTooltips: true,
    // Disable stacking of items
    stack: false,
    // Disable editing of items and groups
    editable: false,
    groupEditable: false,
    // Disable item selection
    selectable: false,
    // Set the start and end dates
    start: new Date(2024, 0, 1),
    min: new Date(2024, 0, 1),
    end: new Date(2024, 0, 8),
    max: new Date(2024, 0, 8)
  };

  // Create a new timeline instance
  var timeline = new Timeline(container);

  // Set the options, groups, and items for the timeline
  timeline.setOptions(options);
  timeline.setGroups(groups);
  timeline.setItems(items);

  // Set the current time to the adjusted day of the week
  var now = new Date();
  var dayOfWeekNumber = now.getUTCDay();
  var adjustedDayOfWeekNumber = dayOfWeekNumber === 0 ? 7 : dayOfWeekNumber;
  timeline.setCurrentTime(new Date(2024, 0, adjustedDayOfWeekNumber, now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()));

  // Open a new tab when an item is clicked
  timeline.on('click', function (props) {
    if (props.item) {
      const itemId = props.item;
      const item = items.get(itemId);
      if (item.group && item.start) {
        window.open(DAG_URI + item.group, '_blank');
      }
    }
  });
}