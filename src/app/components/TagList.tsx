import React from "react";

import { Chip } from "@dynatrace/strato-components-preview/content";
import { Flex } from "@dynatrace/strato-components";
import { monitoredEntitiesCustomTagsClient } from "@dynatrace-sdk/client-classic-environment-v2";
import {
  ToastContainer,
  showToast,
} from "@dynatrace/strato-components-preview/notifications";

export const TagList = ({ tags, id }) => {
  async function DeleteTag(_tag) {
    await monitoredEntitiesCustomTagsClient
      .deleteTags({
        entitySelector: 'type("SERVICE_METHOD"),entityId("' + id + '")',
        key: _tag.split(":")[0],
        value: _tag.split(":")[1],
      })
      .then((response) => {
        console.log(response);
        showToast({
          type: "success",
          title: "Tag Removed",
          message:
            "Tag removed in: " + response.matchedEntitiesCount + " entities.",
        });
      })
      .catch((error) => {
        console.log(error);
        showToast({
          type: "warning",
          role: "alert",
          title: "Delete Tag Failed",
          message: <>{error}</>,
        });
      });
  }
  return (
    <Flex>
      <ToastContainer />
      {tags &&
        tags.map((tag, index) => (
          <Chip>
            <Chip.Key>{tag.split(":")[0]}</Chip.Key>
            {tag.split(":")[1]}
            <Chip.DeleteButton onClick={() => DeleteTag(tag)} />
          </Chip>
        ))}
    </Flex>
  );
};
