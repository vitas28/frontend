import { useModalContext } from "common/context";
import { ItemSplitter } from "common/styles";
import React from "react";
import { useAxios } from "../../../axios";
import { Button } from "../../Buttons";
import { SuggestBrandListModalComponent } from "./styles";

const SuggestBrandListModal = ({
  onComplete = () => {},
  closeModal = () => {},
  data,
}) => {
  const { callAxios, loading } = useAxios({
    alertSuccess: "BrandList Created Successfully",
    onComplete
  });

  const params = {
    method: "POST",
    url: "/brandList",
    data: { name: data.name, category: data.category, brand: data.id, isNewBrand: true }
  }

  return (
    <SuggestBrandListModalComponent>
      <h3>Do you want to create BrandList for this Brand?</h3>
      <ItemSplitter>
        <Button secondary onClick={closeModal}>
          No
        </Button>
        <Button loading={loading} onClick={() => {
          callAxios(params)
          closeModal()
        }}>
          Yes, create.
        </Button>
      </ItemSplitter>
    </SuggestBrandListModalComponent>
  );
};

const useSuggestBrandListModal = () => {
  const { setModalContent, closeModal } = useModalContext();
  const openModal = ({
    data,
  }) => {
    setModalContent(
      <SuggestBrandListModal
        closeModal={closeModal}
        data={data}
      />
    );
  };

  return openModal;
};

export { SuggestBrandListModal, useSuggestBrandListModal };
