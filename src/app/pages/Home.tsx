import React, { useMemo, useState } from "react";
import { Flex, Paragraph, useCurrentTheme } from "@dynatrace/strato-components";
import {
  DataTable,
  Button,
  TABLE_EXPANDABLE_DEFAULT_COLUMN,
  TableColumn,
  TitleBar,
} from "@dynatrace/strato-components-preview";
import {
  FormField,
  Label,
  TextInput,
} from "@dynatrace/strato-components-preview/forms";
import { useDqlQuery } from "@dynatrace-sdk/react-hooks";
import { Modal } from "@dynatrace/strato-components-preview/overlays";
import { TagList } from "../components/TagList";
import {
  monitoredEntitiesCustomTagsClient,
  AddEntityTag,
  AddEntityTags,
} from "@dynatrace-sdk/client-classic-environment-v2";
import {
  ToastContainer,
  showToast,
} from "@dynatrace/strato-components-preview/notifications";
export const Home = () => {
  const theme = useCurrentTheme();
  const [modalState, setModalState] = useState(false);
  const [selectedServiceMethod, setSelectedServiceMethod] =
    useState<string>("My Service");
  const [selectedServiceMethodID, setSelectedServiceMethodID] =
    useState<string>("My Service ID");
  const [currentRow, setCurrentRow] = useState(0);
  const [tagKey, setTagKey] = useState<string>("Key");
  const [tagValue, setTagValue] = useState<string>("Value");
  const serviceList = useDqlQuery({
    body: {
      query: `fetch dt.entity.service
              | filter isNotNull(contains[dt.entity.service_method])
              | fields id, serviceName=entity.name, serviceMethod=contains[dt.entity.service_method]`,
    },
  });
  const expandedRows = useMemo(() => ({}), []);
  function onExpandedRowsChange(expandedRows: Record<number, true>) {
    console.log("Currently expanded:", expandedRows);
  }
  const columns: TableColumn[] = [
    {
      header: "Service Name",
      accessor: "serviceName",
      autoWidth: true,
    },
    {
      header: "Service ID",
      accessor: "id",
      autoWidth: true,
    },
  ];
  function OpenModal(_serviceMethod, _rowNumber) {
    setModalState(true);
    setCurrentRow(_rowNumber);
    setSelectedServiceMethod(_serviceMethod.entityName);
    setSelectedServiceMethodID(_serviceMethod.id);
  }
  async function AddTag(_serviceID, _tagKey, _tagValue) {
    console.log(
      "Adding tag " +
        tagKey +
        " with value: " +
        tagValue +
        "to service id: " +
        _serviceID
    );
    const newTag: AddEntityTag = {
      key: _tagKey,
      value: _tagValue,
    };
    await monitoredEntitiesCustomTagsClient
      .postTags({
        entitySelector: 'type("SERVICE_METHOD"),entityId("' + _serviceID + '")',
        body: { tags: [newTag] },
      })
      .then((response) => {
        console.log(response);
        showToast({
          type: "success",
          title: "Tag Added to " + _serviceID,
          message:
            "Tags: " +
            newTag +
            " in " +
            response.matchedEntitiesCount +
            " entities",
        });
        const myExpandedRows: Record<number, true> = {
          [currentRow]: true,
        };
        onExpandedRowsChange(myExpandedRows);
      });
    setModalState(false);
  }
  function onLoadRow(_rowData) {
    let serviceMethods = "";
    _rowData.serviceMethod.forEach((method) => {
      serviceMethods += '"' + method + '",';
    });
    serviceMethods = serviceMethods.slice(0, -1);
    const keyRequestsList = useDqlQuery({
      body: {
        query:
          `fetch dt.entity.service_method
                | filter in(id, array(` +
          serviceMethods +
          `))
          | fields entityName = entity.name, id, tags`,
      },
    });
    return keyRequestsList;
  }
  return (
    <Flex width="100%" flexDirection="column" justifyContent="center" gap={16}>
      <TitleBar>
        <TitleBar.Title>Tag Applier</TitleBar.Title>
      </TitleBar>
      {serviceList.data && (
        <DataTable
          data={serviceList.data?.records}
          columns={columns}
          expandedRows={expandedRows}
          onExpandedRowsChange={onExpandedRowsChange}
        >
          <DataTable.ExpandableRow>
            {({ row }) => {
              const keyRequests = onLoadRow(row);
              return (
                <Flex flexDirection="column">
                  {!keyRequests.data?.records && (
                    <Paragraph>Loading Requests...</Paragraph>
                  )}
                  {keyRequests.data?.records &&
                    keyRequests.data.records.map((item, index) => (
                      <Flex>
                        <Paragraph
                          style={{ alignContent: "space-around" }}
                          key={item?.id ? item?.id.toString() : index}
                        >
                          {item?.entityName?.toString()}:{" "}
                          <TagList tags={item?.tags} id={item?.id}></TagList>
                        </Paragraph>
                        <Button
                          style={{ marginTop: "20px" }}
                          data-testid="open-modal-button"
                          onClick={() => OpenModal(item, index)}
                          variant="emphasized"
                        >
                          Add Tag
                        </Button>
                      </Flex>
                    ))}
                </Flex>
              );
            }}
          </DataTable.ExpandableRow>
        </DataTable>
      )}
      <Modal
        title={"Request " + selectedServiceMethod?.toString()}
        show={modalState}
        size="small"
        onDismiss={() => setModalState(false)}
      >
        <FormField>
          <Label>Tag</Label>
          <TextInput value={tagKey} onChange={setTagKey} />
          <TextInput value={tagValue} onChange={setTagValue} />
          <Button
            onClick={() => AddTag(selectedServiceMethodID, tagKey, tagValue)}
            variant="emphasized"
            color="primary"
          >
            Add Tag
          </Button>
        </FormField>
      </Modal>
    </Flex>
  );
};
